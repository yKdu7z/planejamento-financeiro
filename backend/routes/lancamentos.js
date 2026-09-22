const express = require('express');
const { db } = require('../db/database');
const autenticar = require('../middleware/auth');

const router = express.Router();
router.use(autenticar);

// RF09/RF10 - Consultar histórico financeiro, com filtro por período e categoria
router.get('/', (req, res) => {
  const { data_inicio, data_fim, categoria_id, tipo } = req.query;

  let sql = `
    SELECT l.*, c.nome AS categoria_nome
    FROM lancamentos l
    LEFT JOIN categorias c ON c.id = l.categoria_id
    WHERE l.usuario_id = ?
  `;
  const params = [req.usuarioId];

  if (data_inicio) {
    sql += ' AND l.data >= ?';
    params.push(data_inicio);
  }
  if (data_fim) {
    sql += ' AND l.data <= ?';
    params.push(data_fim);
  }
  if (categoria_id) {
    sql += ' AND l.categoria_id = ?';
    params.push(categoria_id);
  }
  if (tipo) {
    sql += ' AND l.tipo = ?';
    params.push(tipo);
  }
  sql += ' ORDER BY l.data DESC, l.id DESC';

  res.json(db.prepare(sql).all(...params));
});

// RF04/RF05 - Cadastrar receita ou despesa
router.post('/', (req, res) => {
  const { descricao, valor, data, tipo, categoria_id } = req.body;

  if (!descricao || !valor || !data || !['receita', 'despesa'].includes(tipo)) {
    return res
      .status(400)
      .json({ erro: 'Descrição, valor, data e tipo (receita ou despesa) são obrigatórios.' });
  }
  if (Number(valor) <= 0) {
    return res.status(400).json({ erro: 'O valor deve ser maior que zero.' });
  }

  const info = db
    .prepare(
      `INSERT INTO lancamentos (usuario_id, categoria_id, descricao, valor, data, tipo)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(req.usuarioId, categoria_id || null, descricao, valor, data, tipo);

  res.status(201).json({ id: info.lastInsertRowid });
});

// RF06 - Editar lançamento
router.put('/:id', (req, res) => {
  const existente = db
    .prepare('SELECT * FROM lancamentos WHERE id = ? AND usuario_id = ?')
    .get(req.params.id, req.usuarioId);
  if (!existente) return res.status(404).json({ erro: 'Lançamento não encontrado.' });

  const { descricao, valor, data, tipo, categoria_id } = req.body;

  db.prepare(
    `UPDATE lancamentos SET descricao = ?, valor = ?, data = ?, tipo = ?, categoria_id = ?
     WHERE id = ? AND usuario_id = ?`
  ).run(
    descricao ?? existente.descricao,
    valor ?? existente.valor,
    data ?? existente.data,
    tipo ?? existente.tipo,
    categoria_id ?? existente.categoria_id,
    req.params.id,
    req.usuarioId
  );

  res.json({ mensagem: 'Lançamento atualizado com sucesso.' });
});

// RF07 - Excluir lançamento
router.delete('/:id', (req, res) => {
  const info = db
    .prepare('DELETE FROM lancamentos WHERE id = ? AND usuario_id = ?')
    .run(req.params.id, req.usuarioId);
  if (info.changes === 0) return res.status(404).json({ erro: 'Lançamento não encontrado.' });
  res.json({ mensagem: 'Lançamento excluído com sucesso.' });
});

module.exports = router;
