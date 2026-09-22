const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'planejamento.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ------------------------------------------------------------------
// Modelo de dados (seção 14 da documentação)
// ------------------------------------------------------------------
db.exec(`
CREATE TABLE IF NOT EXISTS usuarios (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  nome      TEXT NOT NULL,
  email     TEXT NOT NULL UNIQUE,
  senha     TEXT NOT NULL,           -- hash bcrypt
  salario   REAL DEFAULT 0,
  moeda     TEXT DEFAULT 'BRL',
  criado_em TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categorias (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  nome       TEXT NOT NULL,
  tipo       TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lancamentos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id  INTEGER NOT NULL,
  categoria_id INTEGER,
  descricao   TEXT NOT NULL,
  valor       REAL NOT NULL CHECK (valor > 0),
  data        TEXT NOT NULL,          -- YYYY-MM-DD
  tipo        TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS metas (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id    INTEGER NOT NULL,
  nome          TEXT NOT NULL,
  valor_objetivo REAL NOT NULL CHECK (valor_objetivo > 0),
  valor_inicial  REAL NOT NULL DEFAULT 0,
  data_inicio    TEXT NOT NULL,
  data_limite    TEXT NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS aportes_meta (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  meta_id INTEGER NOT NULL,
  valor   REAL NOT NULL CHECK (valor > 0),
  data    TEXT NOT NULL,
  FOREIGN KEY (meta_id) REFERENCES metas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orcamentos (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id   INTEGER NOT NULL,
  categoria_id INTEGER NOT NULL,
  mes          INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano          INTEGER NOT NULL,
  limite       REAL NOT NULL CHECK (limite > 0),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE,
  UNIQUE (usuario_id, categoria_id, mes, ano)
);
`);

// Categorias padrão criadas automaticamente para todo novo usuário
const CATEGORIAS_PADRAO = [
  { nome: 'Salário', tipo: 'receita' },
  { nome: 'Freelance', tipo: 'receita' },
  { nome: 'Outras receitas', tipo: 'receita' },
  { nome: 'Alimentação', tipo: 'despesa' },
  { nome: 'Transporte', tipo: 'despesa' },
  { nome: 'Moradia', tipo: 'despesa' },
  { nome: 'Lazer', tipo: 'despesa' },
  { nome: 'Saúde', tipo: 'despesa' },
  { nome: 'Educação', tipo: 'despesa' },
  { nome: 'Outras despesas', tipo: 'despesa' },
];

function criarCategoriasPadrao(usuarioId) {
  const stmt = db.prepare(
    'INSERT INTO categorias (usuario_id, nome, tipo) VALUES (?, ?, ?)'
  );
  const inserirTodas = db.transaction((categorias) => {
    for (const c of categorias) stmt.run(usuarioId, c.nome, c.tipo);
  });
  inserirTodas(CATEGORIAS_PADRAO);
}

module.exports = { db, criarCategoriasPadrao };
