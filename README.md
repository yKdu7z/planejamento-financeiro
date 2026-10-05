# Sistema Web de Planejamento Financeiro

Projeto desenvolvido para a disciplina **Desenvolvimento Web II** — Engenharia de
Software, UNAERP. Implementa integralmente o escopo, os requisitos funcionais e
não funcionais e as regras de negócio descritos na documentação (ABNT) do
projeto.

## Tecnologias utilizadas

| Camada         | Tecnologia                                                    |
|----------------|----------------------------------------------------------------|
| Front-end      | HTML5, CSS3, JavaScript puro (ES6+), Chart.js (via CDN)        |
| Back-end       | PHP 8 puro (sem framework), API REST com padrão MVC            |
| Servidor       | Apache do WAMP                                                 |
| Banco de dados | MySQL 8 do WAMP (via PDO), administrado pelo phpMyAdmin        |
| Autenticação   | Sessão do PHP + `password_hash` (bcrypt) para as senhas        |
| Ferramentas    | Git/GitHub, VS Code                                            |

## Arquitetura

API REST em PHP, separada do front-end. O front (HTML/JS) faz requisições
para `/web2/backend/...` e recebe JSON. No back-end, cada camada tem uma
responsabilidade:

```
navegador → backend/.htaccess → backend/index.php → Router → Controller → Service / Model → MySQL
                                                         └──────── resposta JSON ────────┘
```

- **Router** (`app/core/Router.php` + `app/routes.php`): liga cada URL e
  método HTTP a um método de controller.
- **Controllers** (`app/controllers/`): recebem a requisição, validam os dados
  e montam a resposta. Não escrevem SQL.
- **Models** (`app/models/`): todo o SQL fica aqui, um model por tabela.
- **Services** (`app/services/`): regras de negócio RN01 a RN09, sem acesso
  ao banco.

## Estrutura de pastas

```
WEB2/
├── .htaccess                   # localhost/web2 serve a pasta frontend/
├── README.md
├── frontend/                   # o que roda no navegador
│   ├── index.html              # tela de login
│   ├── cadastro.html, dashboard.html, lancamentos.html,
│   │   metas.html, orcamento.html, relatorios.html, perfil.html
│   ├── css/style.css           # visual, tema claro/escuro e animações
│   └── js/
│       ├── tema.js             # aplica o tema salvo ao abrir a página
│       ├── api.js              # chamadas à API e sessão do usuário
│       ├── nav.js              # menu lateral, troca de tema e navegação sem recarregar
│       └── (um script por tela: login, cadastro, dashboard, lancamentos…)
└── backend/                    # back-end em PHP
    ├── .htaccess               # manda toda requisição /backend/... para o index.php
    ├── index.php               # ponto de entrada único (front controller)
    └── app/                    # bloqueada para acesso direto pelo navegador
        ├── routes.php          # tabela de rotas
        ├── config/config.php   # dados de conexão com o MySQL
        ├── core/               # Router, Request, Resposta, ErroHttp, Database, Auth
        ├── controllers/        # Auth, Categoria, Lancamento, Dashboard, Meta,
        │                       # Orcamento, Relatorio
        ├── models/             # Usuario, Categoria, Lancamento, Meta, Orcamento
        └── services/           # RegrasNegocio (RN01-RN09), MetaService
```

## Como executar

Pré-requisito: WAMP ligado (ícone verde), com o projeto na pasta
`C:\wamp64\www\WEB2` (ou `D:\wamp64\www\WEB2`).

1. **Banco:** o banco `planejamento_financeiro` precisa existir no MySQL do
   WAMP, com as tabelas `usuarios`, `categorias`, `lancamentos`, `metas`,
   `aportes_meta` e `orcamentos`.
2. **Acesse:** `http://localhost/web2`

Não é preciso instalar nem rodar nada além do WAMP. Se o MySQL tiver senha,
preencha em `backend/app/config/config.php`.

## Rotas da API

| Método | Rota                         | O que faz                              |
|--------|------------------------------|----------------------------------------|
| POST   | `/auth/cadastro`             | Cria conta e já entra (RF01)           |
| POST   | `/auth/login`                | Entra no sistema (RF02)                |
| POST   | `/auth/logout`               | Sai do sistema (RF03)                  |
| GET/PUT| `/auth/perfil`               | Consulta e altera o perfil             |
| GET    | `/categorias`                | Lista as categorias do usuário (RF08)  |
| GET/POST | `/lancamentos`             | Histórico com filtros e cadastro (RF04, RF05, RF09, RF10) |
| PUT/DELETE | `/lancamentos/{id}`      | Edita e exclui lançamento (RF06, RF07) |
| GET    | `/dashboard`                 | Saldo, resumo do mês e gráfico (RF11-RF13) |
| GET/POST | `/metas`                   | Lista e cria metas (RF14, RF15, RF17, RF18) |
| DELETE | `/metas/{id}`                | Exclui meta                            |
| POST   | `/metas/{id}/aportes`        | Registra aporte na meta (RF16)         |
| GET/POST | `/orcamentos`              | Lista (com gasto do mês) e cria limites (RF19) |
| DELETE | `/orcamentos/{id}`           | Exclui limite                          |
| GET    | `/relatorios`                | Relatório por período (seção 20)       |
| GET    | `/relatorios/alertas`        | Alertas de orçamento e metas (RF20)    |

## Rastreabilidade com a documentação

Os caminhos do back-end abaixo são relativos a `backend/app/`.

- **RF01–RF03** (autenticação): `controllers/AuthController.php`
- **RF04–RF10** (controle financeiro): `controllers/LancamentoController.php`,
  `controllers/CategoriaController.php`
- **RF11–RF13** (dashboard): `controllers/DashboardController.php`
- **RF14–RF18** (metas financeiras): `controllers/MetaController.php`
- **RF19–RF20** (orçamento e alertas): `controllers/OrcamentoController.php`,
  `controllers/RelatorioController.php`
- **RN01–RN09** (todas as regras de negócio, com os mesmos nomes e fórmulas
  do documento): `services/RegrasNegocio.php`
- **RNF02/RNF03** (autenticação segura e isolamento dos dados por usuário):
  `core/Auth.php` — toda rota não pública exige sessão ativa e todas as
  consultas filtram por `usuario_id`, de modo que um usuário nunca acessa
  dados de outro
- **RNF01/RNF04** (interface responsiva e intuitiva): `frontend/css/style.css`
  (layout em grid, menu lateral vira barra superior em telas menores),
  com tema claro e escuro
- **RNF07** (validação de dados): validações tanto no front-end (atributos
  HTML `required`, `min`, `minlength`) quanto no back-end (cada controller
  valida os dados antes de gravar no banco)

## Sugestão para as seções pendentes da documentação (seções 17, 22, 23)

- **Seção 17 (Interface do Sistema)**: basta rodar o projeto e printar as
  telas listadas — todas já estão implementadas e funcionais.
- **Seção 22 (Cronograma)**: preencher as datas conforme o planejamento da
  equipe; o código já está pronto para servir de base às demonstrações.
- **Seção 25 (Segurança da Informação)**: pode citar o hash de senha com
  bcrypt (`password_hash`), sessão do PHP com cookie `HttpOnly`, consultas
  com *prepared statements* (proteção contra SQL injection) e isolamento de
  dados por usuário (`usuario_id` em todas as consultas).

## Exemplo de uso das regras de negócio (RN03–RN05, seção 18 da doc.)

Ao cadastrar a meta "Viagem para o Japão" com valor objetivo de R$ 20.000,00,
valor inicial de R$ 2.000,00 e prazo de 24 meses, o sistema calcula
automaticamente: valor restante de R$ 18.000,00 e valor mensal necessário de
R$ 750,00 — exatamente como no exemplo da documentação.
