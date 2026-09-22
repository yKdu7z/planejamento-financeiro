# Sistema Web de Planejamento Financeiro

Projeto desenvolvido para a disciplina **Desenvolvimento Web II** — Engenharia de
Software, UNAERP. Implementa integralmente o escopo, os requisitos funcionais e
não funcionais e as regras de negócio descritos na documentação (ABNT) do
projeto.

## Tecnologias utilizadas

| Camada         | Tecnologia                                              |
|----------------|----------------------------------------------------------|
| Front-end      | HTML5, CSS3, JavaScript puro (ES6+), Chart.js (via CDN)  |
| Back-end       | Node.js + Express                                        |
| Banco de dados | SQLite (via `better-sqlite3`)                             |
| Autenticação   | JWT (JSON Web Token) + `bcryptjs` para hash de senha      |
| Ferramentas    | Git/GitHub, VS Code                                       |

Essa é a combinação sugerida para preencher a seção 16 (Tecnologias
Utilizadas) da documentação. Arquitetura: `Usuário → Front-end → API/Back-end
(Node.js + Express) → Banco de Dados (SQLite)`, exatamente como descrito na
seção 15.

## Estrutura de pastas

```
planejamento-financeiro/
├── backend/
│   ├── db/
│   │   └── database.js       # conexão e schema do SQLite (modelo de dados)
│   ├── middleware/
│   │   └── auth.js           # middleware de autenticação JWT
│   ├── routes/
│   │   ├── auth.js           # cadastro, login, logout, perfil (RF01-RF03)
│   │   ├── categorias.js      # categorias (RF08)
│   │   ├── lancamentos.js     # receitas/despesas (RF04-RF10)
│   │   ├── dashboard.js       # saldo, resumo, gráficos (RF11-RF13)
│   │   ├── metas.js          # metas financeiras e aportes (RF14-RF18)
│   │   ├── orcamentos.js      # limites de gastos (RF19-RF20)
│   │   └── relatorios.js      # relatórios e alertas (seções 20-21)
│   ├── utils/
│   │   └── regrasNegocio.js  # RN01 a RN09
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html            # tela de login
    ├── cadastro.html
    ├── dashboard.html
    ├── lancamentos.html
    ├── metas.html
    ├── orcamento.html
    ├── relatorios.html
    ├── perfil.html
    ├── css/style.css
    └── js/ (api.js, nav.js e um script por tela)
```

## Como executar

Pré-requisito: Node.js 18 ou superior.

```bash
cd backend
npm install
cp .env.example .env
npm start
```

O servidor sobe em `http://localhost:3000` e já serve o front-end estático
(a pasta `frontend/`) — basta abrir `http://localhost:3000` no navegador
para acessar a tela de login. Não é necessário nenhum servidor separado
para o front-end.

O banco de dados SQLite (`backend/db/planejamento.db`) é criado
automaticamente na primeira execução, com todas as tabelas do modelo de
dados da seção 14 da documentação.

## Rastreabilidade com a documentação

- **RF01–RF03** (autenticação): `routes/auth.js`
- **RF04–RF10** (controle financeiro): `routes/lancamentos.js`,
  `routes/categorias.js`
- **RF11–RF13** (dashboard): `routes/dashboard.js`
- **RF14–RF18** (metas financeiras): `routes/metas.js`
- **RF19–RF20** (orçamento e alertas): `routes/orcamentos.js`
- **RN01–RN09** (todas as regras de negócio, com os mesmos nomes e fórmulas
  do documento): `utils/regrasNegocio.js`
- **RNF02/RNF03** (autenticação segura e isolamento dos dados por usuário):
  `middleware/auth.js` — toda rota exige token JWT e filtra os dados por
  `usuario_id`, de modo que um usuário nunca acessa dados de outro
- **RNF01/RNF04** (interface responsiva e intuitiva): `css/style.css`
  (layout em grid, sidebar colapsável em telas menores)
- **RNF07** (validação de dados): validações tanto no front-end (atributos
  HTML `required`, `min`, `minlength`) quanto no back-end (cada rota valida
  o corpo da requisição antes de gravar no banco)

## Sugestão para as seções pendentes da documentação (seções 17, 22, 23)

- **Seção 17 (Interface do Sistema)**: basta rodar o projeto e printar as
  telas listadas — todas já estão implementadas e funcionais.
- **Seção 22 (Cronograma)**: preencher as datas conforme o planejamento da
  equipe; o código já está pronto para servir de base às demonstrações.
- **Seção 25 (Segurança da Informação)**: pode citar diretamente o uso de
  hash de senha com `bcrypt`, autenticação via JWT e isolamento de dados por
  usuário (`usuario_id` em todas as consultas), já implementados.

## Exemplo de uso das regras de negócio (RN03–RN05, seção 18 da doc.)

Ao cadastrar a meta "Viagem para o Japão" com valor objetivo de R$ 20.000,00,
valor inicial de R$ 2.000,00 e prazo de 24 meses, o sistema calcula
automaticamente: valor restante de R$ 18.000,00 e valor mensal necessário de
R$ 750,00 — exatamente como no exemplo da documentação.
