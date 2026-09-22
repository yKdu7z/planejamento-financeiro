iniciarLayout('dashboard');

const usuario = Sessao.usuario();
const areaAlerta = document.getElementById('areaAlerta');

async function carregarDashboard() {
  try {
    const dados = await api('/dashboard');

    const saldoEl = document.getElementById('valSaldo');
    saldoEl.textContent = formatarMoeda(dados.saldoAtual, usuario.moeda);
    saldoEl.className = 'valor ' + (dados.saldoAtual >= 0 ? 'positivo' : 'negativo');

    document.getElementById('valReceitas').textContent = formatarMoeda(dados.totalReceitas, usuario.moeda);
    document.getElementById('valDespesas').textContent = formatarMoeda(dados.totalDespesas, usuario.moeda);

    const economiaEl = document.getElementById('valEconomia');
    economiaEl.textContent = formatarMoeda(dados.economiaDoMes, usuario.moeda);
    economiaEl.className = 'valor ' + (dados.economiaDoMes >= 0 ? 'positivo' : 'negativo');

    const variacao = dados.comparacaoMesAnterior.variacao;
    const variacaoEl = document.getElementById('valVariacao');
    if (variacao > 0) {
      variacaoEl.textContent = `↑ ${formatarMoeda(variacao, usuario.moeda)} a mais que o mês anterior`;
    } else if (variacao < 0) {
      variacaoEl.textContent = `↓ ${formatarMoeda(Math.abs(variacao), usuario.moeda)} a menos que o mês anterior`;
    } else {
      variacaoEl.textContent = 'Igual ao mês anterior';
    }

    desenharGrafico(dados.despesasPorCategoria);
  } catch (erro) {
    areaAlerta.innerHTML = `<div class="alerta alerta-erro">${erro.message}</div>`;
  }
}

function desenharGrafico(despesasPorCategoria) {
  const canvas = document.getElementById('graficoCategorias');
  const semDespesas = document.getElementById('semDespesas');

  if (!despesasPorCategoria || despesasPorCategoria.length === 0) {
    canvas.style.display = 'none';
    semDespesas.style.display = 'block';
    return;
  }

  const cores = ['#1d4d78', '#2f6fa8', '#1f9d63', '#e2a13a', '#d64545', '#6b7684', '#8e5fc9', '#2fa8a0'];

  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: despesasPorCategoria.map((d) => d.categoria),
      datasets: [
        {
          data: despesasPorCategoria.map((d) => d.total),
          backgroundColor: despesasPorCategoria.map((_, i) => cores[i % cores.length]),
          borderWidth: 0,
        },
      ],
    },
    options: {
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 12 } } } },
    },
  });
}

async function carregarAlertas() {
  const container = document.getElementById('listaAlertas');
  try {
    const alertas = await api('/relatorios/alertas');
    if (alertas.length === 0) {
      container.innerHTML = '<p class="vazio">Nenhum alerta no momento. Tudo em ordem!</p>';
      return;
    }

    const classePorTipo = {
      limite_ultrapassado: 'critico',
      limite_proximo: 'aviso',
      meta_atrasada: 'aviso',
      meta_concluida: 'sucesso',
      meta_dentro_do_planejamento: 'info',
    };

    container.innerHTML = alertas
      .map(
        (a) => `<div class="item-alerta ${classePorTipo[a.tipo] || 'info'}">${a.mensagem}</div>`
      )
      .join('');
  } catch (erro) {
    container.innerHTML = `<p class="vazio">Não foi possível carregar os alertas.</p>`;
  }
}

carregarDashboard();
carregarAlertas();
