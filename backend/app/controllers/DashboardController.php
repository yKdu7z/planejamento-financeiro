<?php

class DashboardController
{
    public function resumo(Request $req): Resposta
    {
        $lancamentos = new LancamentoModel();
        $hoje = new DateTimeImmutable('today');
        $mesAnterior = $hoje->modify('first day of last month');

        $geral = $lancamentos->totaisPorTipo($req->usuarioId);
        $doMes = $lancamentos->totaisPorTipoNoMes($req->usuarioId, (int) $hoje->format('n'), (int) $hoje->format('Y'));
        $doMesAnterior = $lancamentos->totaisPorTipoNoMes(
            $req->usuarioId,
            (int) $mesAnterior->format('n'),
            (int) $mesAnterior->format('Y')
        );

        $saldoAtual = RegrasNegocio::calcularSaldo($geral['receita'], $geral['despesa']); // RN01
        $economiaDoMes = RegrasNegocio::calcularEconomia($doMes['receita'], $doMes['despesa']); // RN02
        $economiaMesAnterior = RegrasNegocio::calcularEconomia($doMesAnterior['receita'], $doMesAnterior['despesa']);

        // RF13 - Gráfico de despesas por categoria (mês atual)
        $despesasPorCategoria = $lancamentos->despesasPorCategoria(
            $req->usuarioId,
            $hoje->format('Y-m-01'),
            $hoje->format('Y-m-t')
        );

        return Resposta::json([
            'saldoAtual' => $saldoAtual,
            'totalReceitas' => $doMes['receita'],
            'totalDespesas' => $doMes['despesa'],
            'economiaDoMes' => $economiaDoMes,
            'comparacaoMesAnterior' => [
                'economiaMesAtual' => $economiaDoMes,
                'economiaMesAnterior' => $economiaMesAnterior,
                'variacao' => round($economiaDoMes - $economiaMesAnterior, 2),
            ],
            'despesasPorCategoria' => $despesasPorCategoria,
        ]);
    }
}
