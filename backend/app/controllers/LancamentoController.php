<?php
/**
 * Receitas e despesas (RF04-RF10).
 */
class LancamentoController
{
    private LancamentoModel $lancamentos;

    public function __construct()
    {
        $this->lancamentos = new LancamentoModel();
    }

    // RF09/RF10 - Consultar histórico financeiro, com filtro por período e categoria
    public function listar(Request $req): Resposta
    {
        return Resposta::json($this->lancamentos->listar($req->usuarioId, $req->query));
    }

    // RF04/RF05 - Cadastrar receita ou despesa
    public function criar(Request $req): Resposta
    {
        $dados = [
            'descricao' => trim((string) $req->campo('descricao', '')),
            'valor' => (float) $req->campo('valor', 0),
            'data' => $req->campo('data'),
            'tipo' => $req->campo('tipo'),
            'categoria_id' => $req->campo('categoria_id') ?: null,
        ];

        if ($dados['descricao'] === '' || !$dados['data'] || !in_array($dados['tipo'], ['receita', 'despesa'], true)) {
            throw new ErroHttp(400, 'Descrição, valor, data e tipo (receita ou despesa) são obrigatórios.');
        }
        if ($dados['valor'] <= 0) {
            throw new ErroHttp(400, 'O valor deve ser maior que zero.');
        }

        $id = $this->lancamentos->criar($req->usuarioId, $dados);
        return Resposta::json(['id' => $id], 201);
    }

    // RF06 - Editar lançamento (campos não enviados mantêm o valor atual)
    public function atualizar(Request $req): Resposta
    {
        $id = (int) $req->params['id'];
        $atual = $this->lancamentos->buscar($id, $req->usuarioId);
        if (!$atual) {
            throw new ErroHttp(404, 'Lançamento não encontrado.');
        }

        $dados = [
            'descricao' => $req->campo('descricao', $atual['descricao']),
            'valor' => (float) $req->campo('valor', $atual['valor']),
            'data' => $req->campo('data', $atual['data']),
            'tipo' => $req->campo('tipo', $atual['tipo']),
            'categoria_id' => $req->campo('categoria_id', $atual['categoria_id']) ?: null,
        ];
        if ($dados['valor'] <= 0) {
            throw new ErroHttp(400, 'O valor deve ser maior que zero.');
        }

        $this->lancamentos->atualizar($id, $req->usuarioId, $dados);
        return Resposta::json(['mensagem' => 'Lançamento atualizado com sucesso.']);
    }

    // RF07 - Excluir lançamento
    public function excluir(Request $req): Resposta
    {
        if (!$this->lancamentos->excluir((int) $req->params['id'], $req->usuarioId)) {
            throw new ErroHttp(404, 'Lançamento não encontrado.');
        }
        return Resposta::json(['mensagem' => 'Lançamento excluído com sucesso.']);
    }
}
