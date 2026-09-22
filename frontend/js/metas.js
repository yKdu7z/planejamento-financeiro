iniciarLayout('metas');

const usuario = Sessao.usuario();
const areaAlerta = document.getElementById('areaAlerta');
const listaMetas = document.getElementById('listaMetas');
const semMetas = document.getElementById('semMetas');

const modalFundo = document.getElementById('modalFundo');
const modalAlerta = document.getElementById('modalAlerta');
const formMeta = document.getElementById('formMeta');

const modalAporteFundo = document.getElementById('modalAporteFundo');
const modalAporteAlerta = document.getElementById('modalAporteAlerta');
const formAporte = document.getElementById('formAporte');

const RÓTULO_SITUACAO = {
  concluida: { texto: 'Concluída', classe: 'tag-concluida' },
  dentro_do_planejamento: { texto: 'Dentro do planejamento', classe: 'tag-dentro' },
  atrasada: { texto: 'Atrasada', classe: 'tag-atrasada' },
};

async function carregarMetas() {
  try {
    const metas = await api('/metas');

    if (metas.length === 0) {
      listaMetas.innerHTML = '';
      semMetas.style.display = 'block';
      return;
    }
    semMetas.style.display = 'none';

    listaMetas.innerHTML = metas
      .map((m) => {
        const situacao = RÓTULO_SITUACAO[m.situacao] || RÓTULO_SITUACAO.dentro_do_planejamento;
        return `
        <div class="card-meta">
          <div class="card-meta-topo">
            <h3>${m.nome}</h3>
            <span class="tag ${situacao.classe}">${situacao.texto}</span>
          </div>
          <div class="barra-progresso">
            <div class="${m.situacao === 'atrasada' ? 'atrasada' : ''}" style="width:${m.progresso_percentual}%;"></div>
          </div>
          <div class="card-meta-numeros">
            <div>Objetivo<b>${formatarMoeda(m.valor_objetivo, usuario.moeda)}</b></div>
            <div>Acumulado<b>${formatarMoeda(m.valor_acumulado, usuario.moeda)}</b></div>
            <div>Restante<b>${formatarMoeda(m.valor_restante, usuario.moeda)}</b></div>
            <div>Necessário/mês<b>${formatarMoeda(m.valor_mensal_necessario, usuario.moeda)}</b></div>
            <div>Prazo<b>${formatarData(m.data_limite)}</b></div>
            <div>Progresso<b>${m.progresso_percentual}%</b></div>
          </div>
          <div class="acoes-linha" style="margin-top:12px;">
            <button class="btn btn-sucesso btn-pequeno" data-aporte="${m.id}">+ Registrar aporte</button>
            <button class="btn btn-perigo btn-pequeno" data-excluir="${m.id}">Excluir</button>
          </div>
        </div>`;
      })
      .join('');

    listaMetas.querySelectorAll('[data-aporte]').forEach((btn) =>
      btn.addEventListener('click', () => abrirModalAporte(btn.dataset.aporte))
    );
    listaMetas.querySelectorAll('[data-excluir]').forEach((btn) =>
      btn.addEventListener('click', () => excluirMeta(btn.dataset.excluir))
    );
  } catch (erro) {
    areaAlerta.innerHTML = `<div class="alerta alerta-erro">${erro.message}</div>`;
  }
}

async function excluirMeta(id) {
  if (!confirm('Deseja realmente excluir esta meta?')) return;
  try {
    await api(`/metas/${id}`, { method: 'DELETE' });
    carregarMetas();
  } catch (erro) {
    areaAlerta.innerHTML = `<div class="alerta alerta-erro">${erro.message}</div>`;
  }
}

document.getElementById('btnNovaMeta').addEventListener('click', () => {
  formMeta.reset();
  document.getElementById('data_inicio').value = hojeISO();
  modalAlerta.innerHTML = '';
  modalFundo.classList.add('aberto');
});
document.getElementById('btnCancelar').addEventListener('click', () => modalFundo.classList.remove('aberto'));

formMeta.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  modalAlerta.innerHTML = '';

  const corpo = {
    nome: document.getElementById('nome').value.trim(),
    valor_objetivo: Number(document.getElementById('valor_objetivo').value),
    valor_inicial: Number(document.getElementById('valor_inicial').value) || 0,
    data_inicio: document.getElementById('data_inicio').value,
    data_limite: document.getElementById('data_limite').value,
  };

  try {
    await api('/metas', { method: 'POST', body: JSON.stringify(corpo) });
    modalFundo.classList.remove('aberto');
    carregarMetas();
  } catch (erro) {
    modalAlerta.innerHTML = `<div class="alerta alerta-erro">${erro.message}</div>`;
  }
});

function abrirModalAporte(metaId) {
  formAporte.reset();
  document.getElementById('aporteMetaId').value = metaId;
  document.getElementById('aporteData').value = hojeISO();
  modalAporteAlerta.innerHTML = '';
  modalAporteFundo.classList.add('aberto');
}
document.getElementById('btnCancelarAporte').addEventListener('click', () => modalAporteFundo.classList.remove('aberto'));

formAporte.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  modalAporteAlerta.innerHTML = '';

  const metaId = document.getElementById('aporteMetaId').value;
  const corpo = {
    valor: Number(document.getElementById('aporteValor').value),
    data: document.getElementById('aporteData').value,
  };

  try {
    await api(`/metas/${metaId}/aportes`, { method: 'POST', body: JSON.stringify(corpo) });
    modalAporteFundo.classList.remove('aberto');
    carregarMetas();
  } catch (erro) {
    modalAporteAlerta.innerHTML = `<div class="alerta alerta-erro">${erro.message}</div>`;
  }
});

carregarMetas();
