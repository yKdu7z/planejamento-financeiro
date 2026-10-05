<?php
/**
 * Ponto de entrada único da API (front controller).
 *
 * Fluxo de uma requisição:
 *   navegador → .htaccess → index.php → Router → Controller → Model (banco) → resposta JSON
 */

declare(strict_types=1);

date_default_timezone_set('America/Sao_Paulo');
header('Content-Type: application/json; charset=utf-8');

// Carrega automaticamente as classes das pastas core, controllers, models e services
spl_autoload_register(function (string $classe): void {
    foreach (['core', 'controllers', 'models', 'services'] as $pasta) {
        $arquivo = __DIR__ . "/app/$pasta/$classe.php";
        if (is_file($arquivo)) {
            require $arquivo;
            return;
        }
    }
});

Auth::iniciarSessao();

try {
    $router = new Router();
    require __DIR__ . '/app/routes.php';

    $requisicao = Request::capturar();
    $resposta = $router->despachar($requisicao);
    $resposta->enviar();
} catch (ErroHttp $erro) {
    // Erros esperados (validação, não encontrado, não autenticado...)
    Resposta::json(['erro' => $erro->getMessage()], $erro->status)->enviar();
} catch (PDOException $erro) {
    error_log($erro->getMessage());
    Resposta::json(['erro' => 'Erro ao acessar o banco de dados.'], 500)->enviar();
} catch (Throwable $erro) {
    error_log((string) $erro);
    Resposta::json(['erro' => 'Erro interno do servidor.'], 500)->enviar();
}
