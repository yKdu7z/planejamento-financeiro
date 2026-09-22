const express = require('express');
const { db } = require('../db/database');
const autenticar = require('../middleware/auth');
const { avaliarOrcamento } = require('../utils/regrasNegocio');

const router = express.Router();
router.use(autenticar);

// RF19 - Listar orçamentos de um mês/ano, já comparados com o gasto realizado (RN06/RN07)
router.get('/', (req, res) => {
  const hoje = new Date();
  const mes = Number(req.query.mes) || hoje.getMonth() + 1;
  const ano = Number(req.query.ano) || hoje.getFullYear();

  const orcamentos = db
    .prepare(
      `SELECT o.*, c.nome AS categoria_nome
       FROM orcamentos o
       JOIN categorias c ON c.id = o.categoria_id
       WHERE o.usuario_id = ? AND o.mes = ? AND o.ano = ?`
    )
    .all(req.usuarioId, mes, ano);

  const resultado = orcamentos.map((o) => {
    const gasto = db
      .prepare(
        `SELECT COALESCE(SUM(valor), 0) AS total
         FROM lancamentos
         WHERE usuario_id = ? AND categoria_id = ? AND tipo = 'despesa'
           AND CAST(strftime('%m', data) AS INTEGER) = ?
           AND CAST(strftime('%Y', data) AS INTEGER) = ?`
      )
      .get(req.usuarioId, o.categoria_id, mes, ano).total;

    return {
      id: o.id,
      categoria_id: o.categoria_id,
      categoria_nome: o.categoria_nome,
      mes: o.mes,
      ano: o.ano,
      ...avaliarOrcamento(gasto, o.limite), // RN06/RN07
    };
  });

  res.json(resultado);
});

// RF19 - Definir limite de gastos por categoria
router.post('/', (req, res) => {
  const { categoria_id, mes, ano, limite } = req.body;
  if (!categoria_id || !mes || !ano || !limite) {
    return res
      .status(400)
      .json({ erro: 'Categoria, mês, ano e limite são obrigatórios.' });
  }

  try {
    const info = db
      .prepare(
        `INSERT INTO orcamentos (usuario_id, categoria_id, mes, ano, limite)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(req.usuarioId, categoria_id, mes, ano, limite);
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res
        .status(409)
        .json({ erro: 'Já existe um orçamento para esta categoria neste mês.' });
    }
    res.status(500).json({ erro: 'Erro ao criar orçamento.' });
  }
});

router.put('/:id', (req, res) => {
  const orcamento = db
    .prepare('SELECT * FROM orcamentos WHERE id = ? AND usuario_id = ?')
    .get(req.params.id, req.usuarioId);
  if (!orcamento) return res.status(404).json({ erro: 'Orçamento não encontrado.' });

  const { limite } = req.body;
  db.prepare('UPDATE orcamentos SET limite = ? WHERE id = ?').run(
    limite ?? orcamento.limite,
    orcamento.id
  );
  res.json({ mensagem: 'Orçamento atualizado com sucesso.' });
});

router.delete('/:id', (req, res) => {
  const info = db
    .prepare('DELETE FROM orcamentos WHERE id = ? AND usuario_id = ?')
    .run(req.params.id, req.usuarioId);
  if (info.changes === 0) return res.status(404).json({ erro: 'Orçamento não encontrado.' });
  res.json({ mensagem: 'Orçamento excluído com sucesso.' });
});

module.exports = router;
