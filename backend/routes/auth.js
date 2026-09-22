const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, criarCategoriasPadrao } = require('../db/database');
const autenticar = require('../middleware/auth');

const router = express.Router();

function gerarToken(usuario) {
  return jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// RF01 - Cadastro de usuário
router.post('/cadastro', (req, res) => {
  const { nome, email, senha, salario, moeda } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter ao menos 6 caracteres.' });
  }

  const existente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
  if (existente) {
    return res.status(409).json({ erro: 'Já existe uma conta com este e-mail.' });
  }

  const hash = bcrypt.hashSync(senha, 10);

  const info = db
    .prepare(
      'INSERT INTO usuarios (nome, email, senha, salario, moeda) VALUES (?, ?, ?, ?, ?)'
    )
    .run(nome, email, hash, salario || 0, moeda || 'BRL');

  criarCategoriasPadrao(info.lastInsertRowid);

  const usuario = { id: info.lastInsertRowid, nome, email };
  const token = gerarToken(usuario);

  res.status(201).json({ token, usuario });
});

// RF02 - Login de usuário
router.post('/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe e-mail e senha.' });
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  if (!usuario || !bcrypt.compareSync(senha, usuario.senha)) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }

  const token = gerarToken(usuario);
  res.json({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      salario: usuario.salario,
      moeda: usuario.moeda,
    },
  });
});

// RF03 - Logout de usuário (stateless: o front-end descarta o token)
router.post('/logout', autenticar, (req, res) => {
  res.json({ mensagem: 'Logout realizado com sucesso.' });
});

// Gerenciamento de informações do perfil
router.get('/perfil', autenticar, (req, res) => {
  const usuario = db
    .prepare('SELECT id, nome, email, salario, moeda, criado_em FROM usuarios WHERE id = ?')
    .get(req.usuarioId);
  res.json(usuario);
});

router.put('/perfil', autenticar, (req, res) => {
  const { nome, salario, moeda, senha } = req.body;

  const usuarioAtual = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.usuarioId);

  const novoNome = nome ?? usuarioAtual.nome;
  const novoSalario = salario ?? usuarioAtual.salario;
  const novaMoeda = moeda ?? usuarioAtual.moeda;
  const novaSenhaHash = senha ? bcrypt.hashSync(senha, 10) : usuarioAtual.senha;

  db.prepare(
    'UPDATE usuarios SET nome = ?, salario = ?, moeda = ?, senha = ? WHERE id = ?'
  ).run(novoNome, novoSalario, novaMoeda, novaSenhaHash, req.usuarioId);

  res.json({ mensagem: 'Perfil atualizado com sucesso.' });
});

module.exports = router;
