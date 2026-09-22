const express = require('express');
const { db } = require('../db/database');
const autenticar = require('../middleware/auth');
const {
  calcularValorRestante,
  calcularValorMensalNecessario,
  calcularProgressoMeta,
  calcularSituacaoMeta,
} = require('../utils/regrasNegocio');

const router = express.Router();
router.use(autenticar);

function valorAcumulado(metaId, valorInicial) {
  const soma = db
    .prepare('SELECT COALESCE(SUM(valor), 0) AS total FROM aportes_meta WHERE meta_id = ?')
    .get(metaId).total;
  return valorInicial + soma;
}

function enriquecerMeta(meta) {
  const acumulado = valorAcumulado(meta.id, meta.valor_inicial);
  const restante = calcularValorRestante(meta.valor_objetivo, acumulado); // RN03
  return {
    ...meta,
    valor_acumulado: acumulado,
    valor_restante: restante, // RN03
    valor_mensal_necessario: calcularValorMensalNecessario(restante, meta.data_limite), // RN04
    progresso_percentual: calcularProgressoMeta(acumulado, meta.valor_objetivo), // RN05
    situacao: calcularSituacaoMeta(meta, acumulado), // RN08 / RN09
  };
}

// RF17/RF18 - Listar metas com progresso e situação
router.get('/', (req, res) => {
  const metas = db
    .prepare('SELECT * FROM metas WHERE usuario_id = ? ORDER BY data_limite')
    .all(req.usuarioId);
  res.json(metas.map(enriquecerMeta));
});

router.get('/:id', (req, res) => {
  const meta = db
    .prepare('SELECT * FROM metas WHERE id = ? AND usuario_id = ?')
    .get(req.params.id, req.usuarioId);
  if (!meta) return res.status(404).json({ erro: 'Meta não encontrada.' });

  const aportes = db
    .prepare('SELECT * FROM aportes_meta WHERE meta_id = ? ORDER BY data DESC')
    .all(meta.id);

  res.json({ ...enriquecerMeta(meta), aportes });
});

// RF14/RF15 - Cadastrar meta com valor objetivo e prazo
router.post('/', (req, res) => {
  const { nome, valor_objetivo, valor_inicial, data_inicio, data_limite } = req.body;

  if (!nome || !valor_objetivo || !data_inicio || !data_limite) {
    return res
      .status(400)
      .json({ erro: 'Nome, valor objetivo, data de início e data limite são obrigatórios.' });
  }
  if (new Date(data_limite) <= new Date(data_inicio)) {
    return res.status(400).json({ erro: 'A data limite deve ser posterior à data de início.' });
  }

  const info = db
    .prepare(
      `INSERT INTO metas (usuario_id, nome, valor_objetivo, valor_inicial, data_inicio, data_limite)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(req.usuarioId, nome, valor_objetivo, valor_inicial || 0, data_inicio, data_limite);

  res.status(201).json({ id: info.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const meta = db
    .prepare('SELECT * FROM metas WHERE id = ? AND usuario_id = ?')
    .get(req.params.id, req.usuarioId);
  if (!meta) return res.status(404).json({ erro: 'Meta não encontrada.' });

  const { nome, valor_objetivo, data_limite } = req.body;
  db.prepare('UPDATE metas SET nome = ?, valor_objetivo = ?, data_limite = ? WHERE id = ?').run(
    nome ?? meta.nome,
    valor_objetivo ?? meta.valor_objetivo,
    data_limite ?? meta.data_limite,
    meta.id
  );
  res.json({ mensagem: 'Meta atualizada com sucesso.' });
});

router.delete('/:id', (req, res) => {
  const info = db
    .prepare('DELETE FROM metas WHERE id = ? AND usuario_id = ?')
    .run(req.params.id, req.usuarioId);
  if (info.changes === 0) return res.status(404).json({ erro: 'Meta não encontrada.' });
  res.json({ mensagem: 'Meta excluída com sucesso.' });
});

// RF16/RF17 - Registrar aporte (acompanhamento do progresso da meta)
router.post('/:id/aportes', (req, res) => {
  const meta = db
    .prepare('SELECT * FROM metas WHERE id = ? AND usuario_id = ?')
    .get(req.params.id, req.usuarioId);
  if (!meta) return res.status(404).json({ erro: 'Meta não encontrada.' });

  const { valor, data } = req.body;
  if (!valor || Number(valor) <= 0) {
    return res.status(400).json({ erro: 'Informe um valor de aporte maior que zero.' });
  }

  const info = db
    .prepare('INSERT INTO aportes_meta (meta_id, valor, data) VALUES (?, ?, ?)')
    .run(meta.id, valor, data || new Date().toISOString().slice(0, 10));

  res.status(201).json({ id: info.lastInsertRowid, meta: enriquecerMeta(meta) });
});

module.exports = router;
