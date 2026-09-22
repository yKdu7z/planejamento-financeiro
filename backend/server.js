require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

require('./db/database'); // garante que o schema seja criado na inicialização

const authRoutes = require('./routes/auth');
const categoriaRoutes = require('./routes/categorias');
const lancamentoRoutes = require('./routes/lancamentos');
const dashboardRoutes = require('./routes/dashboard');
const metaRoutes = require('./routes/metas');
const orcamentoRoutes = require('./routes/orcamentos');
const relatorioRoutes = require('./routes/relatorios');

const app = express();

app.use(cors());
app.use(express.json());

// RNF01 - Interface responsiva / servir o front-end estático
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/lancamentos', lancamentoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/metas', metaRoutes);
app.use('/api/orcamentos', orcamentoRoutes);
app.use('/api/relatorios', relatorioRoutes);

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', mensagem: 'API do Sistema de Planejamento Financeiro no ar.' });
});

// RNF07 - Tratamento de erros gerais / validação
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
