<?php
class MetaService
{
    private MetaModel $metas;

    public function __construct()
    {
        $this->metas = new MetaModel();
    }

    /** Valor inicial + soma dos aportes */
    public function valorAcumulado(array $meta): float
    {
        return (float) $meta['valor_inicial'] + $this->metas->totalAportes((int) $meta['id']);
    }

    /** Meta com valor acumulado, restante, mensal necessário, progresso e situação */
    public function enriquecer(array $meta): array
    {
        $acumulado = $this->valorAcumulado($meta);
        $restante = RegrasNegocio::calcularValorRestante((float) $meta['valor_objetivo'], $acumulado); // RN03

        return $meta + [
            'valor_acumulado' => $acumulado,
            'valor_restante' => $restante, // RN03
            'valor_mensal_necessario' => RegrasNegocio::calcularValorMensalNecessario($restante, $meta['data_limite']), // RN04
            'progresso_percentual' => RegrasNegocio::calcularProgressoMeta($acumulado, (float) $meta['valor_objetivo']), // RN05
            'situacao' => RegrasNegocio::calcularSituacaoMeta($meta, $acumulado), // RN08 / RN09
        ];
    }
}
