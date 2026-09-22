const express = require('express');
const { db } = require('../db/database');
const autenticar = require('../middleware/auth');
const { calcularSaldo, calcularEconomia } = require('../utils/regrasNegocio');

const router = express.Router();
router.use(autenticar);

// RF11/RF12/RF13 - Saldo, dashboard e gráficos
router.get('/', (req, res) => {
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  const mesAnteriorData = new Date(anoAtual, mesAtual - 2, 1);
  const mesAnterior = mesAnteriorData.getMonth() + 1;
  const anoDoMesAnterior = mesAnteriorData.getFullYear();

  const totalPorTipo = (usuarioId) => {
    const linhas = db
      .prepare(
        `SELECT tipo, COALESCE(SUM(valor), 0) AS total
         FROM lancamentos WHERE usuario_id = ? GROUP BY tipo`
      )
      .all(usuarioId);
    const totais = { receita: 0, despesa: 0 };
    linhas.forEach((l) => (totais[l.tipo] = l.total));
    return totais;
  };

  const totalPorTipoNoMes = (usuarioId, mes, ano) => {
    const linhas = db
      .prepare(
        `SELECT tipo, COALESCE(SUM(valor), 0) AS total
         FROM lancamentos
         WHERE usuario_id = ?
           AND CAST(strftime('%m', data) AS INTEGER) = ?
           AND CAST(strftime('%Y', data) AS INTEGER) = ?
         GROUP BY tipo`
      )
      .all(usuarioId, mes, ano);
    const totais = { receita: 0, despesa: 0 };
    linhas.forEach((l) => (totais[l.tipo] = l.total));
    return totais;
  };

  const geral = totalPorTipo(req.usuarioId);
  const mesAtualTotais = totalPorTipoNoMes(req.usuarioId, mesAtual, anoAtual);
  const mesAnteriorTotais = totalPorTipoNoMes(req.usuarioId, mesAnterior, anoDoMesAnterior);

  const saldoAtual = calcularSaldo(geral.receita, geral.despesa); // RN01
  const economiaDoMes = calcularEconomia(mesAtualTotais.receita, mesAtualTotais.despesa); // RN02
  const economiaMesAnterior = calcularEconomia(
    mesAnteriorTotais.receita,
    mesAnteriorTotais.despesa
  );

  // RF13 - Gráfico de despesas por categoria (mês atual)
  const despesasPorCategoria = db
    .prepare(
      `SELECT COALESCE(c.nome, 'Sem categoria') AS categoria, COALESCE(SUM(l.valor), 0) AS total
       FROM lancamentos l
       LEFT JOIN categorias c ON c.id = l.categoria_id
       WHERE l.usuario_id = ? AND l.tipo = 'despesa'
         AND CAST(strftime('%m', l.data) AS INTEGER) = ?
         AND CAST(strftime('%Y', l.data) AS INTEGER) = ?
       GROUP BY c.nome
       ORDER BY total DESC`
    )
    .all(req.usuarioId, mesAtual, anoAtual);

  res.json({
    saldoAtual,
    totalReceitas: mesAtualTotais.receita,
    totalDespesas: mesAtualTotais.despesa,
    economiaDoMes,
    comparacaoMesAnterior: {
      economiaMesAtual: economiaDoMes,
      economiaMesAnterior,
      variacao: round2(economiaDoMes - economiaMesAnterior),
    },
    despesasPorCategoria,
  });
});

function round2(v) {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

module.exports = router;
