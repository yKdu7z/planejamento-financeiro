<?php

class RelatorioController
{
    // RF09 / seção 20 - Relatórios financeiros simples
    public function gerar(Request $req): Resposta
    {
        $inicio = ($req->query['data_inicio'] ?? '') ?: '1000-01-01';
        $fim = ($req->query['data_fim'] ?? '') ?: '9999-12-31';
        $lancamentos = new LancamentoModel();
        $servico = new MetaService();

        $totais = $lancamentos->totaisPorTipo($req->usuarioId, $inicio, $fim);

        // Evolução do saldo ao longo do tempo (agrupado por mês)
        $evolucaoMensal = array_map(
            fn ($m) => $m + ['saldo' => round($m['receitas'] - $m['despesas'], 2)],
            $lancamentos->evolucaoMensal($req->usuarioId, $inicio, $fim)
        );

        // Progresso consolidado das metas financeiras
        $progressoMetas = [];
        foreach ((new MetaModel())->listar($req->usuarioId) as $meta) {
            $acumulado = $servico->valorAcumulado($meta);
            $progressoMetas[] = [
                'id' => $meta['id'],
                'nome' => $meta['nome'],
                'progresso_percentual' => RegrasNegocio::calcularProgressoMeta($acumulado, $meta['valor_objetivo']),
                'situacao' => RegrasNegocio::calcularSituacaoMeta($meta, $acumulado),
            ];
        }

        return Resposta::json([
            'totalReceitas' => $totais['receita'],
            'totalDespesas' => $totais['despesa'],
            'gastosPorCategoria' => $lancamentos->despesasPorCategoria($req->usuarioId, $inicio, $fim),
            'evolucaoMensal' => $evolucaoMensal,
            'progressoMetas' => $progressoMetas,
        ]);
    }

    // RF20 / seção 21 - Notificações e alertas
    public function alertas(Request $req): Resposta
    {
        $mes = (int) date('n');
        $ano = (int) date('Y');
        $lancamentos = new LancamentoModel();
        $servico = new MetaService();
        $alertas = [];

        // Alertas de orçamento (RN07)
        foreach ((new OrcamentoModel())->listarDoMes($req->usuarioId, $mes, $ano) as $o) {
            $gasto = $lancamentos->gastoDaCategoriaNoMes($req->usuarioId, $o['categoria_id'], $mes, $ano);
            $avaliacao = RegrasNegocio::avaliarOrcamento($gasto, $o['limite']);

            if ($avaliacao['status'] === 'ultrapassado') {
                $alertas[] = [
                    'tipo' => 'limite_ultrapassado',
                    'mensagem' => sprintf(
                        'O limite de %s foi ultrapassado (R$ %.2f de R$ %.2f).',
                        $o['categoria_nome'],
                        $avaliacao['gastoRealizado'],
                        $o['limite']
                    ),
                ];
            } elseif ($avaliacao['status'] === 'proximo_do_limite') {
                $alertas[] = [
                    'tipo' => 'limite_proximo',
                    'mensagem' => "O limite de {$o['categoria_nome']} está próximo de ser atingido ({$avaliacao['percentual']}%).",
                ];
            }
        }

        // Alertas de metas (RN08/RN09)
        foreach ((new MetaModel())->listar($req->usuarioId) as $meta) {
            $situacao = RegrasNegocio::calcularSituacaoMeta($meta, $servico->valorAcumulado($meta));

            $alertas[] = match ($situacao) {
                'atrasada' => ['tipo' => 'meta_atrasada', 'mensagem' => "A meta \"{$meta['nome']}\" está atrasada."],
                'concluida' => ['tipo' => 'meta_concluida', 'mensagem' => "A meta \"{$meta['nome']}\" foi concluída!"],
                default => ['tipo' => 'meta_dentro_do_planejamento', 'mensagem' => "A meta \"{$meta['nome']}\" está dentro do planejamento."],
            };
        }

        return Resposta::json($alertas);
    }
}
