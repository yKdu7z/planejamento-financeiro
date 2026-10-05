<?php
/**
 * Metas financeiras e aportes (RF14-RF18).
 */
class MetaController
{
    private MetaModel $metas;
    private MetaService $servico;

    public function __construct()
    {
        $this->metas = new MetaModel();
        $this->servico = new MetaService();
    }

    // RF17/RF18 - Listar metas com progresso e situação
    public function listar(Request $req): Resposta
    {
        $metas = $this->metas->listar($req->usuarioId);
        return Resposta::json(array_map([$this->servico, 'enriquecer'], $metas));
    }

    // RF14/RF15 - Cadastrar meta com valor objetivo e prazo
    public function criar(Request $req): Resposta
    {
        $dados = [
            'nome' => trim((string) $req->campo('nome', '')),
            'valor_objetivo' => (float) $req->campo('valor_objetivo', 0),
            'valor_inicial' => (float) $req->campo('valor_inicial', 0),
            'data_inicio' => $req->campo('data_inicio'),
            'data_limite' => $req->campo('data_limite'),
        ];

        if ($dados['nome'] === '' || $dados['valor_objetivo'] <= 0 || !$dados['data_inicio'] || !$dados['data_limite']) {
            throw new ErroHttp(400, 'Nome, valor objetivo, data de início e data limite são obrigatórios.');
        }
        if ($dados['data_limite'] <= $dados['data_inicio']) {
            throw new ErroHttp(400, 'A data limite deve ser posterior à data de início.');
        }

        $id = $this->metas->criar($req->usuarioId, $dados);
        return Resposta::json(['id' => $id], 201);
    }

    public function excluir(Request $req): Resposta
    {
        if (!$this->metas->excluir((int) $req->params['id'], $req->usuarioId)) {
            throw new ErroHttp(404, 'Meta não encontrada.');
        }
        return Resposta::json(['mensagem' => 'Meta excluída com sucesso.']);
    }

    // RF16/RF17 - Registrar aporte (acompanhamento do progresso da meta)
    public function registrarAporte(Request $req): Resposta
    {
        $meta = $this->buscarOuFalhar($req);
        $valor = (float) $req->campo('valor', 0);
        if ($valor <= 0) {
            throw new ErroHttp(400, 'Informe um valor de aporte maior que zero.');
        }

        $id = $this->metas->criarAporte($meta['id'], $valor, $req->campo('data') ?: date('Y-m-d'));
        return Resposta::json(['id' => $id, 'meta' => $this->servico->enriquecer($meta)], 201);
    }

    private function buscarOuFalhar(Request $req): array
    {
        $meta = $this->metas->buscar((int) $req->params['id'], $req->usuarioId);
        if (!$meta) {
            throw new ErroHttp(404, 'Meta não encontrada.');
        }
        return $meta;
    }
}
