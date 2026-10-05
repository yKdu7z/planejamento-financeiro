<?php

// Autenticação e perfil (RF01-RF03)
$router->post('/auth/cadastro', [AuthController::class, 'cadastrar'], true);
$router->post('/auth/login', [AuthController::class, 'login'], true);
$router->post('/auth/logout', [AuthController::class, 'logout'], true);
$router->get('/auth/perfil', [AuthController::class, 'perfil']);
$router->put('/auth/perfil', [AuthController::class, 'atualizarPerfil']);

// Categorias (RF08)
$router->get('/categorias', [CategoriaController::class, 'listar']);

// Lançamentos: receitas e despesas (RF04-RF10)
$router->get('/lancamentos', [LancamentoController::class, 'listar']);
$router->post('/lancamentos', [LancamentoController::class, 'criar']);
$router->put('/lancamentos/{id}', [LancamentoController::class, 'atualizar']);
$router->delete('/lancamentos/{id}', [LancamentoController::class, 'excluir']);

// Dashboard (RF11-RF13)
$router->get('/dashboard', [DashboardController::class, 'resumo']);

// Metas financeiras e aportes (RF14-RF18)
$router->get('/metas', [MetaController::class, 'listar']);
$router->post('/metas', [MetaController::class, 'criar']);
$router->delete('/metas/{id}', [MetaController::class, 'excluir']);
$router->post('/metas/{id}/aportes', [MetaController::class, 'registrarAporte']);

// Orçamentos: limites de gastos (RF19-RF20)
$router->get('/orcamentos', [OrcamentoController::class, 'listar']);
$router->post('/orcamentos', [OrcamentoController::class, 'criar']);
$router->delete('/orcamentos/{id}', [OrcamentoController::class, 'excluir']);

// Relatórios e alertas (seções 20-21)
$router->get('/relatorios', [RelatorioController::class, 'gerar']);
$router->get('/relatorios/alertas', [RelatorioController::class, 'alertas']);
