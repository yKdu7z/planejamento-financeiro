/**
 * Implementação das regras de negócio descritas na seção 11 da
 * documentação (RN01 a RN09).
 */

// RN01 — Cálculo do saldo: Saldo = Receitas - Despesas
function calcularSaldo(totalReceitas, totalDespesas) {
  return round2(totalReceitas - totalDespesas);
}

// RN02 — Economia do período: Economia = Receitas - Despesas (do período)
function calcularEconomia(receitasPeriodo, despesasPeriodo) {
  return round2(receitasPeriodo - despesasPeriodo);
}

// RN03 — Valor restante da meta: Valor restante = Valor objetivo - Valor acumulado
function calcularValorRestante(valorObjetivo, valorAcumulado) {
  return round2(Math.max(valorObjetivo - valorAcumulado, 0));
}

// RN04 — Valor mensal necessário: Valor mensal = Valor restante / Meses restantes
function calcularValorMensalNecessario(valorRestante, dataLimite, hoje = new Date()) {
  const mesesRestantes = mesesEntre(hoje, new Date(dataLimite));
  if (mesesRestantes <= 0) {
    // prazo já vencido ou é o mês atual: precisa do valor total restante agora
    return round2(valorRestante);
  }
  return round2(valorRestante / mesesRestantes);
}

// RN05 — Progresso da meta: percentual = valor acumulado / valor objetivo
function calcularProgressoMeta(valorAcumulado, valorObjetivo) {
  if (valorObjetivo <= 0) return 0;
  const percentual = (valorAcumulado / valorObjetivo) * 100;
  return round2(Math.min(percentual, 100));
}

// RN08/RN09 — Situação da meta: dentro do planejamento ou atrasada,
// comparando o valor acumulado com o progresso esperado (linear) para o período.
function calcularSituacaoMeta(meta, valorAcumulado, hoje = new Date()) {
  const inicio = new Date(meta.data_inicio);
  const limite = new Date(meta.data_limite);
  const objetivo = meta.valor_objetivo;
  const inicial = meta.valor_inicial;

  if (valorAcumulado >= objetivo) return 'concluida';

  const duracaoTotalDias = Math.max(diasEntre(inicio, limite), 1);
  const decorridoDias = Math.min(Math.max(diasEntre(inicio, hoje), 0), duracaoTotalDias);
  const proporcaoDecorrida = decorridoDias / duracaoTotalDias;

  const valorEsperado = inicial + (objetivo - inicial) * proporcaoDecorrida;

  if (hoje > limite && valorAcumulado < objetivo) return 'atrasada';

  // RN08 — dentro do planejamento / RN09 — atrasada
  return valorAcumulado >= valorEsperado ? 'dentro_do_planejamento' : 'atrasada';
}

// RN06 — Limite de gastos: compara gastos realizados na categoria com o limite definido
// RN07 — Alerta de orçamento: aviso quando próximo (>=80%) ou acima do limite
function avaliarOrcamento(gastoRealizado, limite) {
  const percentual = limite > 0 ? round2((gastoRealizado / limite) * 100) : 0;
  let status = 'dentro_do_limite';
  if (gastoRealizado > limite) status = 'ultrapassado';
  else if (percentual >= 80) status = 'proximo_do_limite';
  return { gastoRealizado: round2(gastoRealizado), limite, percentual, status };
}

// --- helpers -------------------------------------------------------
function mesesEntre(dataInicial, dataFinal) {
  const meses =
    (dataFinal.getFullYear() - dataInicial.getFullYear()) * 12 +
    (dataFinal.getMonth() - dataInicial.getMonth());
  return meses;
}

function diasEntre(dataInicial, dataFinal) {
  const MS_POR_DIA = 1000 * 60 * 60 * 24;
  return Math.round((dataFinal - dataInicial) / MS_POR_DIA);
}

function round2(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

module.exports = {
  calcularSaldo,
  calcularEconomia,
  calcularValorRestante,
  calcularValorMensalNecessario,
  calcularProgressoMeta,
  calcularSituacaoMeta,
  avaliarOrcamento,
};
