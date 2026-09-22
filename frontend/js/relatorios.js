iniciarLayout('relatorios');

const usuario = Sessao.usuario();
const areaAlerta = document.getElementById('areaAlerta');

let graficoEvolucao, graficoGastos;

const RÓTULO_SITUACAO = {
  concluida: { texto: 'Concluída', classe: 'tag-concluida' },
  dentro_do_planejamento: { texto: 'Dentro do planejamento', classe: 'tag-dentro' },
  atrasada: { texto: 'Atrasada', classe: 'tag-atrasada' },
};

async function gerarRelatorio() {
  try {
    const inicio = document.getElementById('dataInicio').value;
    const fim = document.getElementById('dataFim').value;
    const params = new URLSearchParams();
    if (inicio) params.set('data_inicio', inicio);
    if (fim) params.set('data_fim', fim);

    const dados = await api(`/relatorios?${params.toString()}`);

    document.getElementById('valReceitas').textContent = formatarMoeda(dados.totalReceitas, usuario.moeda);
    document.getElementById('valDespesas').textContent = formatarMoeda(dados.totalDespesas, usuario.moeda);
    const saldoEl = document.getElementById('valSaldoPeriodo');
    const saldo = dados.totalReceitas - dados.totalDespesas;
    saldoEl.textContent = formatarMoeda(saldo, usuario.moeda);
    saldoEl.className = 'valor ' + (saldo >= 0 ? 'positivo' : 'negativo');

    desenharEvolucao(dados.evolucaoMensal);
    desenharGastos(dados.gastosPorCategoria);
    preencherMetas(dados.progressoMetas);
  } catch (erro) {
    areaAlerta.innerHTML = `<div class="alerta alerta-erro">${erro.message}</div>`;
  }
}

function desenharEvolucao(evolucaoMensal) {
  const ctx = document.getElementById('graficoEvolucao');
  if (graficoEvolucao) graficoEvolucao.destroy();

  graficoEvolucao = new Chart(ctx, {
    type: 'line',
    data: {
      labels: evolucaoMensal.map((m) => m.mes),
      datasets: [
        {
          label: 'Saldo mensal',
          data: evolucaoMensal.map((m) => m.saldo),
          borderColor: '#1d4d78',
          backgroundColor: 'rgba(29, 77, 120, 0.12)',
          fill: true,
          tension: 0.25,
        },
      ],
    },
    options: { plugins: { legend: { display: false } } },
  });
}

function desenharGastos(gastosPorCategoria) {
  const ctx = document.getElementById('graficoGastos');
  if (graficoGastos) graficoGastos.destroy();

  graficoGastos = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: gastosPorCategoria.map((g) => g.categoria),
      datasets: [
        {
          label: 'Gasto',
          data: gastosPorCategoria.map((g) => g.total),
          backgroundColor: '#2f6fa8',
          borderRadius: 6,
        },
      ],
    },
    options: { plugins: { legend: { display: false } }, scales: { x: { ticks: { autoSkip: false } } } },
  });
}

function preencherMetas(progressoMetas) {
  const corpo = document.getElementById('corpoMetas');
  const semMetas = document.getElementById('semMetas');

  if (progressoMetas.length === 0) {
    corpo.innerHTML = '';
    semMetas.style.display = 'block';
    return;
  }
  semMetas.style.display = 'none';

  corpo.innerHTML = progressoMetas
    .map((m) => {
      const situacao = RÓTULO_SITUACAO[m.situacao] || RÓTULO_SITUACAO.dentro_do_planejamento;
      return `<tr>
        <td>${m.nome}</td>
        <td>${m.progresso_percentual}%</td>
        <td><span class="tag ${situacao.classe}">${situacao.texto}</span></td>
      </tr>`;
    })
    .join('');
}

gerarRelatorio();
document.getElementById('btnGerar').addEventListener('click', gerarRelatorio);
