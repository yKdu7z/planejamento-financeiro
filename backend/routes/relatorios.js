const express = require('express');
const { db } = require('../db/database');
const autenticar = require('../middleware/auth');
const { avaliarOrcamento, calcularSituacaoMeta, calcularProgressoMeta } = require('../utils/regrasNegocio');

const router = express.Router();
router.use(autenticar);

// RF09 / seção 20 - Relatórios financeiros simples
router.get('/', (req, res) => {
  const { data_inicio, data_fim } = req.query;
  const inicio = data_inicio || '0001-01-01';
  const fim = data_fim || '9999-12-31';

  // Total de receitas e despesas por período selecionado
  const totais = db
    .prepare(
      `SELECT tipo, COALESCE(SUM(valor), 0) AS total
       FROM lancamentos
       WHERE usuario_id = ? AND data BETWEEN ? AND ?
       GROUP BY tipo`
    )
    .all(req.usuarioId, inicio, fim);
  const totaisPorTipo = { receita: 0, despesa: 0 };
  totais.forEach((t) => (totaisPorTipo[t.tipo] = t.total));

  // Gastos por categoria
  const gastosPorCategoria = db
    .prepare(
      `SELECT COALESCE(c.nome, 'Sem categoria') AS categoria, COALESCE(SUM(l.valor), 0) AS total
       FROM lancamentos l
       LEFT JOIN categorias c ON c.id = l.categoria_id
       WHERE l.usuario_id = ? AND l.tipo = 'despesa' AND l.data BETWEEN ? AND ?
       GROUP BY c.nome
       ORDER BY total DESC`
    )
    .all(req.usuarioId, inicio, fim);

  // Evolução do saldo ao longo do tempo (agrupado por mês)
  const evolucaoMensal = db
    .prepare(
      `SELECT strftime('%Y-%m', data) AS mes,
              COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) AS receitas,
              COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) AS despesas
       FROM lancamentos
       WHERE usuario_id = ? AND data BETWEEN ? AND ?
       GROUP BY mes
       ORDER BY mes`
    )
    .all(req.usuarioId, inicio, fim)
    .map((m) => ({ ...m, saldo: round2(m.receitas - m.despesas) }));

  // Progresso consolidado das metas financeiras
  const metas = db.prepare('SELECT * FROM metas WHERE usuario_id = ?').all(req.usuarioId);
  const progressoMetas = metas.map((meta) => {
    const acumulado =
      meta.valor_inicial +
      db
        .prepare('SELECT COALESCE(SUM(valor), 0) AS total FROM aportes_meta WHERE meta_id = ?')
        .get(meta.id).total;
    return {
      id: meta.id,
      nome: meta.nome,
      progresso_percentual: calcularProgressoMeta(acumulado, meta.valor_objetivo),
      situacao: calcularSituacaoMeta(meta, acumulado),
    };
  });

  res.json({
    totalReceitas: totaisPorTipo.receita,
    totalDespesas: totaisPorTipo.despesa,
    gastosPorCategoria,
    evolucaoMensal,
    progressoMetas,
  });
});

// RF20 / seção 21 - Notificações e alertas
router.get('/alertas', (req, res) => {
  const hoje = new Date();
  const mes = hoje.getMonth() + 1;
  const ano = hoje.getFullYear();
  const alertas = [];

  // Alertas de orçamento (RN07)
  const orcamentos = db
    .prepare(
      `SELECT o.*, c.nome AS categoria_nome
       FROM orcamentos o
       JOIN categorias c ON c.id = o.categoria_id
       WHERE o.usuario_id = ? AND o.mes = ? AND o.ano = ?`
    )
    .all(req.usuarioId, mes, ano);

  orcamentos.forEach((o) => {
    const gasto = db
      .prepare(
        `SELECT COALESCE(SUM(valor), 0) AS total FROM lancamentos
         WHERE usuario_id = ? AND categoria_id = ? AND tipo = 'despesa'
           AND CAST(strftime('%m', data) AS INTEGER) = ?
           AND CAST(strftime('%Y', data) AS INTEGER) = ?`
      )
      .get(req.usuarioId, o.categoria_id, mes, ano).total;

    const avaliacao = avaliarOrcamento(gasto, o.limite);
    if (avaliacao.status === 'ultrapassado') {
      alertas.push({
        tipo: 'limite_ultrapassado',
        mensagem: `O limite de ${o.categoria_nome} foi ultrapassado (R$ ${avaliacao.gastoRealizado.toFixed(
          2
        )} de R$ ${o.limite.toFixed(2)}).`,
      });
    } else if (avaliacao.status === 'proximo_do_limite') {
      alertas.push({
        tipo: 'limite_proximo',
        mensagem: `O limite de ${o.categoria_nome} está próximo de ser atingido (${avaliacao.percentual}%).`,
      });
    }
  });

  // Alertas de metas (RN08/RN09)
  const metas = db.prepare('SELECT * FROM metas WHERE usuario_id = ?').all(req.usuarioId);
  metas.forEach((meta) => {
    const acumulado =
      meta.valor_inicial +
      db
        .prepare('SELECT COALESCE(SUM(valor), 0) AS total FROM aportes_meta WHERE meta_id = ?')
        .get(meta.id).total;
    const situacao = calcularSituacaoMeta(meta, acumulado);

    if (situacao === 'atrasada') {
      alertas.push({ tipo: 'meta_atrasada', mensagem: `A meta "${meta.nome}" está atrasada.` });
    } else if (situacao === 'concluida') {
      alertas.push({ tipo: 'meta_concluida', mensagem: `A meta "${meta.nome}" foi concluída!` });
    } else {
      alertas.push({
        tipo: 'meta_dentro_do_planejamento',
        mensagem: `A meta "${meta.nome}" está dentro do planejamento.`,
      });
    }
  });

  res.json(alertas);
});

function round2(v) {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

module.exports = router;
