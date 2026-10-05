<?php
/**
 * Roteador: liga cada URL + método HTTP a um método de um controller.
 * As rotas são declaradas em app/routes.php.
 *
 * Exemplo: $router->put('/lancamentos/{id}', [LancamentoController::class, 'atualizar']);
 *   PUT /web2/api/lancamentos/7 → LancamentoController->atualizar($req) com $req->params['id'] = '7'
 */
class Router
{
    private array $rotas = [];

    public function get(string $caminho, array $acao, bool $publica = false): void
    {
        $this->adicionar('GET', $caminho, $acao, $publica);
    }

    public function post(string $caminho, array $acao, bool $publica = false): void
    {
        $this->adicionar('POST', $caminho, $acao, $publica);
    }

    public function put(string $caminho, array $acao, bool $publica = false): void
    {
        $this->adicionar('PUT', $caminho, $acao, $publica);
    }

    public function delete(string $caminho, array $acao, bool $publica = false): void
    {
        $this->adicionar('DELETE', $caminho, $acao, $publica);
    }

    private function adicionar(string $metodo, string $caminho, array $acao, bool $publica): void
    {
        // '/metas/{id}/aportes' vira a expressão regular '#^/metas/(?P<id>[^/]+)/aportes$#'
        $regex = '#^' . preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', $caminho) . '$#';
        $this->rotas[] = compact('metodo', 'regex', 'acao', 'publica');
    }

    public function despachar(Request $req): Resposta
    {
        $caminhoExiste = false;

        foreach ($this->rotas as $rota) {
            if (!preg_match($rota['regex'], $req->caminho, $encontrados)) {
                continue;
            }
            $caminhoExiste = true;
            if ($rota['metodo'] !== $req->metodo) {
                continue;
            }

            // Rotas protegidas exigem usuário logado (RNF02 / RNF03)
            if (!$rota['publica']) {
                $req->usuarioId = Auth::exigirUsuario();
            }

            $req->params = array_filter($encontrados, 'is_string', ARRAY_FILTER_USE_KEY);

            [$classe, $metodo] = $rota['acao'];
            return (new $classe())->$metodo($req);
        }

        if ($caminhoExiste) {
            throw new ErroHttp(405, 'Método não permitido para esta rota.');
        }
        throw new ErroHttp(404, 'Rota não encontrada.');
    }
}
