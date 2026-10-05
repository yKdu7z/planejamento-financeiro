<?php
/**
 * Regras de negócio da seção 11 da documentação (RN01 a RN09).
 * Não acessa o banco: recebe valores e devolve resultados calculados.
 */
class RegrasNegocio
{
    // RN01 — Cálculo do saldo: Saldo = Receitas - Despesas
    public static function calcularSaldo(float $totalReceitas, float $totalDespesas): float
    {
        return round($totalReceitas - $totalDespesas, 2);
    }

    // RN02 — Economia do período: Economia = Receitas - Despesas (do período)
    public static function calcularEconomia(float $receitasPeriodo, float $despesasPeriodo): float
    {
        return round($receitasPeriodo - $despesasPeriodo, 2);
    }

    // RN03 — Valor restante da meta: Valor restante = Valor objetivo - Valor acumulado
    public static function calcularValorRestante(float $valorObjetivo, float $valorAcumulado): float
    {
        return round(max($valorObjetivo - $valorAcumulado, 0), 2);
    }

    // RN04 — Valor mensal necessário: Valor mensal = Valor restante / Meses restantes
    public static function calcularValorMensalNecessario(float $valorRestante, string $dataLimite): float
    {
        $mesesRestantes = self::mesesEntre(new DateTimeImmutable('today'), new DateTimeImmutable($dataLimite));
        if ($mesesRestantes <= 0) {
            // prazo já vencido ou é o mês atual: precisa do valor total restante agora
            return round($valorRestante, 2);
        }
        return round($valorRestante / $mesesRestantes, 2);
    }

    // RN05 — Progresso da meta: percentual = valor acumulado / valor objetivo
    public static function calcularProgressoMeta(float $valorAcumulado, float $valorObjetivo): float
    {
        if ($valorObjetivo <= 0) {
            return 0;
        }
        return round(min($valorAcumulado / $valorObjetivo * 100, 100), 2);
    }

    // RN08/RN09 — Situação da meta: dentro do planejamento ou atrasada,
    // comparando o valor acumulado com o progresso esperado (linear) para o período.
    public static function calcularSituacaoMeta(array $meta, float $valorAcumulado): string
    {
        $hoje = new DateTimeImmutable();
        $inicio = new DateTimeImmutable($meta['data_inicio']);
        $limite = new DateTimeImmutable($meta['data_limite']);
        $objetivo = (float) $meta['valor_objetivo'];
        $inicial = (float) $meta['valor_inicial'];

        if ($valorAcumulado >= $objetivo) {
            return 'concluida';
        }

        $duracaoTotalDias = max(self::diasEntre($inicio, $limite), 1);
        $decorridoDias = min(max(self::diasEntre($inicio, $hoje), 0), $duracaoTotalDias);
        $proporcaoDecorrida = $decorridoDias / $duracaoTotalDias;

        $valorEsperado = $inicial + ($objetivo - $inicial) * $proporcaoDecorrida;

        if ($hoje > $limite) {
            return 'atrasada';
        }

        // RN08 — dentro do planejamento / RN09 — atrasada
        return $valorAcumulado >= $valorEsperado ? 'dentro_do_planejamento' : 'atrasada';
    }

    // RN06 — Limite de gastos: compara gastos realizados na categoria com o limite definido
    // RN07 — Alerta de orçamento: aviso quando próximo (>=80%) ou acima do limite
    public static function avaliarOrcamento(float $gastoRealizado, float $limite): array
    {
        $percentual = $limite > 0 ? round($gastoRealizado / $limite * 100, 2) : 0;
        $status = 'dentro_do_limite';
        if ($gastoRealizado > $limite) {
            $status = 'ultrapassado';
        } elseif ($percentual >= 80) {
            $status = 'proximo_do_limite';
        }
        return [
            'gastoRealizado' => round($gastoRealizado, 2),
            'limite' => $limite,
            'percentual' => $percentual,
            'status' => $status,
        ];
    }

    // --- auxiliares ---------------------------------------------------

    private static function mesesEntre(DateTimeImmutable $inicial, DateTimeImmutable $final): int
    {
        return ((int) $final->format('Y') - (int) $inicial->format('Y')) * 12
            + ((int) $final->format('n') - (int) $inicial->format('n'));
    }

    private static function diasEntre(DateTimeImmutable $inicial, DateTimeImmutable $final): int
    {
        return (int) round(($final->getTimestamp() - $inicial->getTimestamp()) / 86400);
    }
}
