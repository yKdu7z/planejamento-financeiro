const express = require('express');
const { db } = require('../db/database');
const autenticar = require('../middleware/auth');

const router = express.Router();
router.use(autenticar);

// Listar categorias do usuário (opcionalmente filtradas por tipo)
router.get('/', (req, res) => {
  const { tipo } = req.query;
  let categorias;
  if (tipo) {
    categorias = db
      .prepare('SELECT * FROM categorias WHERE usuario_id = ? AND tipo = ? ORDER BY nome')
      .all(req.usuarioId, tipo);
  } else {
    categorias = db
      .prepare('SELECT * FROM categorias WHERE usuario_id = ? ORDER BY tipo, nome')
      .all(req.usuarioId);
  }
  res.json(categorias);
});

// Criar categoria personalizada
router.post('/', (req, res) => {
  const { nome, tipo } = req.body;
  if (!nome || !['receita', 'despesa'].includes(tipo)) {
    return res.status(400).json({ erro: 'Nome e tipo (receita ou despesa) são obrigatórios.' });
  }
  const info = db
    .prepare('INSERT INTO categorias (usuario_id, nome, tipo) VALUES (?, ?, ?)')
    .run(req.usuarioId, nome, tipo);
  res.status(201).json({ id: info.lastInsertRowid, nome, tipo });
});

// Excluir categoria (somente se pertencer ao usuário)
router.delete('/:id', (req, res) => {
  const info = db
    .prepare('DELETE FROM categorias WHERE id = ? AND usuario_id = ?')
    .run(req.params.id, req.usuarioId);
  if (info.changes === 0) return res.status(404).json({ erro: 'Categoria não encontrada.' });
  res.json({ mensagem: 'Categoria excluída.' });
});

module.exports = router;
