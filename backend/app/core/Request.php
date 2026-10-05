<?php
/**
 * Dados da requisição já organizados para os controllers.
 */
class Request
{
    public string $metodo;
    public string $caminho;   // ex.: '/lancamentos/7'
    public array $corpo;      // JSON enviado pelo front
    public array $query;      // parâmetros da URL (?mes=10&ano=2026)
    public array $params = []; // partes variáveis da rota ({id})
    public ?int $usuarioId = null;

    public static function capturar(): self
    {
        $req = new self();
        $req->metodo = $_SERVER['REQUEST_METHOD'];
        $req->query = $_GET;
        $req->corpo = json_decode(file_get_contents('php://input') ?: '[]', true) ?: [];

        // Remove o prefixo da pasta (/web2/api) para sobrar só a rota
        $uri = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
        $base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
        if (stripos($uri, $base) === 0) {
            $uri = substr($uri, strlen($base));
        }
        if (stripos($uri, '/index.php') === 0) {
            $uri = substr($uri, strlen('/index.php'));
        }
        $req->caminho = '/' . trim($uri, '/');

        return $req;
    }

    /** Valor do corpo da requisição, ou $padrao se não veio */
    public function campo(string $nome, mixed $padrao = null): mixed
    {
        return $this->corpo[$nome] ?? $padrao;
    }
}
