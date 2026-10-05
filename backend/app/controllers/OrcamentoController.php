<?php
/**
 * Limites de gastos por categoria (RF19-RF20).
 */
class OrcamentoController
{
    private OrcamentoModel $orcamentos;

    public function __construct()
    {
        $this->orcamentos = new OrcamentoModel();
    }

    // RF19 - Listar orçamentos de um mês/ano, já comparados com o gasto realizado (RN06/RN07)
    public function listar(Request $req): Resposta
    {
        $mes = (int) ($req->query['mes'] ?? 0) ?: (int) date('n');
        $ano = (int) ($req->query['ano'] ?? 0) ?: (int) date('Y');
        $lancamentos = new LancamentoModel();

        $resultado = [];
        foreach ($this->orcamentos->listarDoMes($req->usuarioId, $mes, $ano) as $o) {
            $gasto = $lancamentos->gastoDaCategoriaNoMes($req->usuarioId, $o['categoria_id'], $mes, $ano);
            $resultado[] = [
                'id' => $o['id'],
                'categoria_id' => $o['categoria_id'],
                'categoria_nome' => $o['categoria_nome'],
                'mes' => $o['mes'],
                'ano' => $o['ano'],
            ] + RegrasNegocio::avaliarOrcamento($gasto, $o['limite']); // RN06/RN07
        }

        return Resposta::json($resultado);
    }

    // RF19 - Definir limite de gastos por categoria
    public function criar(Request $req): Resposta
    {
        $categoriaId = (int) $req->campo('categoria_id', 0);
        $mes = (int) $req->campo('mes', 0);
        $ano = (int) $req->campo('ano', 0);
        $limite = (float) $req->campo('limite', 0);

        if (!$categoriaId || !$mes || !$ano || $limite <= 0) {
            throw new ErroHttp(400, 'Categoria, mês, ano e limite são obrigatórios.');
        }

        $id = $this->orcamentos->criar($req->usuarioId, $categoriaId, $mes, $ano, $limite);
        if ($id === null) {
            throw new ErroHttp(409, 'Já existe um orçamento para esta categoria neste mês.');
        }
        return Resposta::json(['id' => $id], 201);
    }

    public function excluir(Request $req): Resposta
    {
        if (!$this->orcamentos->excluir((int) $req->params['id'], $req->usuarioId)) {
            throw new ErroHttp(404, 'Orçamento não encontrado.');
        }
        return Resposta::json(['mensagem' => 'Orçamento excluído com sucesso.']);
    }
}
