iniciarLayout('orcamento');

const usuario = Sessao.usuario();
const areaAlerta = document.getElementById('areaAlerta');
const listaOrcamentos = document.getElementById('listaOrcamentos');
const semOrcamentos = document.getElementById('semOrcamentos');

const modalFundo = document.getElementById('modalFundo');
const modalAlerta = document.getElementById('modalAlerta');
const formOrcamento = document.getElementById('formOrcamento');

const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function preencherSelectsMes(selects) {
  const opcoes = NOMES_MESES.map((nome, i) => `<option value="${i + 1}">${nome}</option>`).join('');
  selects.forEach((s) => (s.innerHTML = opcoes));
}

function iniciarPeriodoPadrao() {
  const hoje = new Date();
  document.getElementById('filtroMes').value = hoje.getMonth() + 1;
  document.getElementById('filtroAno').value = hoje.getFullYear();
  document.getElementById('mes').value = hoje.getMonth() + 1;
  document.getElementById('ano').value = hoje.getFullYear();
}

async function carregarCategoriasDespesa() {
  const categorias = await api('/categorias?tipo=despesa');
  document.getElementById('categoria_id').innerHTML = categorias
    .map((c) => `<option value="${c.id}">${c.nome}</option>`)
    .join('');
}

async function carregarOrcamentos() {
  try {
    const mes = document.getElementById('filtroMes').value;
    const ano = document.getElementById('filtroAno').value;
    const orcamentos = await api(`/orcamentos?mes=${mes}&ano=${ano}`);

    if (orcamentos.length === 0) {
      listaOrcamentos.innerHTML = '';
      semOrcamentos.style.display = 'block';
      return;
    }
    semOrcamentos.style.display = 'none';

    const rotuloStatus = {
      dentro_do_limite: { texto: 'Dentro do limite', cor: 'var(--verde)' },
      proximo_do_limite: { texto: 'Próximo do limite', cor: 'var(--amarelo)' },
      ultrapassado: { texto: 'Limite ultrapassado', cor: 'var(--vermelho)' },
    };

    listaOrcamentos.innerHTML = orcamentos
      .map((o) => {
        const status = rotuloStatus[o.status];
        const largura = Math.min(o.percentual, 100);
        return `
        <div class="item-orcamento">
          <div class="item-orcamento-topo">
            <strong>${o.categoria_nome}</strong>
            <span class="valores">${formatarMoeda(o.gastoRealizado, usuario.moeda)} de ${formatarMoeda(o.limite, usuario.moeda)} — <span style="color:${status.cor}; font-weight:600;">${status.texto}</span></span>
          </div>
          <div class="barra-progresso">
            <div style="width:${largura}%; background:${status.cor};"></div>
          </div>
          <div class="acoes-linha">
            <button class="btn btn-perigo btn-pequeno" data-excluir="${o.id}">Excluir</button>
          </div>
        </div>`;
      })
      .join('');

    listaOrcamentos.querySelectorAll('[data-excluir]').forEach((btn) =>
      btn.addEventListener('click', () => excluirOrcamento(btn.dataset.excluir))
    );
  } catch (erro) {
    areaAlerta.innerHTML = `<div class="alerta alerta-erro">${erro.message}</div>`;
  }
}

async function excluirOrcamento(id) {
  if (!confirm('Deseja realmente excluir este limite?')) return;
  try {
    await api(`/orcamentos/${id}`, { method: 'DELETE' });
    carregarOrcamentos();
  } catch (erro) {
    areaAlerta.innerHTML = `<div class="alerta alerta-erro">${erro.message}</div>`;
  }
}

document.getElementById('btnFiltrar').addEventListener('click', carregarOrcamentos);

document.getElementById('btnNovoOrcamento').addEventListener('click', () => {
  formOrcamento.reset();
  const hoje = new Date();
  document.getElementById('mes').value = hoje.getMonth() + 1;
  document.getElementById('ano').value = hoje.getFullYear();
  modalAlerta.innerHTML = '';
  modalFundo.classList.add('aberto');
});
document.getElementById('btnCancelar').addEventListener('click', () => modalFundo.classList.remove('aberto'));

formOrcamento.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  modalAlerta.innerHTML = '';

  const corpo = {
    categoria_id: Number(document.getElementById('categoria_id').value),
    mes: Number(document.getElementById('mes').value),
    ano: Number(document.getElementById('ano').value),
    limite: Number(document.getElementById('limite').value),
  };

  try {
    await api('/orcamentos', { method: 'POST', body: JSON.stringify(corpo) });
    modalFundo.classList.remove('aberto');
    carregarOrcamentos();
  } catch (erro) {
    modalAlerta.innerHTML = `<div class="alerta alerta-erro">${erro.message}</div>`;
  }
});

(async function iniciar() {
  preencherSelectsMes([document.getElementById('filtroMes'), document.getElementById('mes')]);
  iniciarPeriodoPadrao();
  await carregarCategoriasDespesa();
  await carregarOrcamentos();
})();
