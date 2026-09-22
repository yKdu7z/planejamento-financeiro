iniciarLayout('lancamentos');

const usuario = Sessao.usuario();
const areaAlerta = document.getElementById('areaAlerta');
const corpoTabela = document.getElementById('corpoTabela');
const tabelaVazia = document.getElementById('tabelaVazia');

const modalFundo = document.getElementById('modalFundo');
const modalTitulo = document.getElementById('modalTitulo');
const modalAlerta = document.getElementById('modalAlerta');
const formLancamento = document.getElementById('formLancamento');

let categorias = [];

async function carregarCategorias() {
  categorias = await api('/categorias');
  preencherSelect(document.getElementById('categoria_id'), categorias, true);
  preencherSelect(document.getElementById('filtroCategoria'), categorias, false, 'Todas');
}

function preencherSelect(select, lista, incluirVazio, rotuloVazio) {
  const atual = select.id === 'filtroCategoria' ? '<option value="">Todas</option>' : '<option value="">Sem categoria</option>';
  select.innerHTML = atual + lista
    .map((c) => `<option value="${c.id}">${c.nome} (${c.tipo === 'receita' ? 'receita' : 'despesa'})</option>`)
    .join('');
}

function montarFiltros() {
  const params = new URLSearchParams();
  const inicio = document.getElementById('filtroInicio').value;
  const fim = document.getElementById('filtroFim').value;
  const tipo = document.getElementById('filtroTipo').value;
  const categoria_id = document.getElementById('filtroCategoria').value;
  if (inicio) params.set('data_inicio', inicio);
  if (fim) params.set('data_fim', fim);
  if (tipo) params.set('tipo', tipo);
  if (categoria_id) params.set('categoria_id', categoria_id);
  return params.toString();
}

async function carregarLancamentos() {
  try {
    const query = montarFiltros();
    const lista = await api(`/lancamentos${query ? '?' + query : ''}`);

    if (lista.length === 0) {
      corpoTabela.innerHTML = '';
      tabelaVazia.style.display = 'block';
      return;
    }
    tabelaVazia.style.display = 'none';

    corpoTabela.innerHTML = lista
      .map(
        (l) => `
      <tr>
        <td>${formatarData(l.data)}</td>
        <td>${l.descricao}</td>
        <td>${l.categoria_nome || '—'}</td>
        <td><span class="tag ${l.tipo === 'receita' ? 'tag-receita' : 'tag-despesa'}">${l.tipo === 'receita' ? 'Receita' : 'Despesa'}</span></td>
        <td>${l.tipo === 'despesa' ? '-' : ''}${formatarMoeda(l.valor, usuario.moeda)}</td>
        <td class="acoes-linha">
          <button class="btn btn-secundario btn-pequeno" data-editar="${l.id}">Editar</button>
          <button class="btn btn-perigo btn-pequeno" data-excluir="${l.id}">Excluir</button>
        </td>
      </tr>`
      )
      .join('');

    corpoTabela.querySelectorAll('[data-editar]').forEach((btn) =>
      btn.addEventListener('click', () => abrirModalEdicao(lista.find((l) => l.id == btn.dataset.editar)))
    );
    corpoTabela.querySelectorAll('[data-excluir]').forEach((btn) =>
      btn.addEventListener('click', () => excluirLancamento(btn.dataset.excluir))
    );
  } catch (erro) {
    areaAlerta.innerHTML = `<div class="alerta alerta-erro">${erro.message}</div>`;
  }
}

function abrirModalNovo() {
  formLancamento.reset();
  document.getElementById('lancamentoId').value = '';
  document.getElementById('data').value = hojeISO();
  modalTitulo.textContent = 'Novo lançamento';
  modalAlerta.innerHTML = '';
  modalFundo.classList.add('aberto');
}

function abrirModalEdicao(lancamento) {
  document.getElementById('lancamentoId').value = lancamento.id;
  document.getElementById('tipo').value = lancamento.tipo;
  document.getElementById('descricao').value = lancamento.descricao;
  document.getElementById('valor').value = lancamento.valor;
  document.getElementById('data').value = lancamento.data;
  document.getElementById('categoria_id').value = lancamento.categoria_id || '';
  modalTitulo.textContent = 'Editar lançamento';
  modalAlerta.innerHTML = '';
  modalFundo.classList.add('aberto');
}

function fecharModal() {
  modalFundo.classList.remove('aberto');
}

async function excluirLancamento(id) {
  if (!confirm('Deseja realmente excluir este lançamento?')) return;
  try {
    await api(`/lancamentos/${id}`, { method: 'DELETE' });
    carregarLancamentos();
  } catch (erro) {
    areaAlerta.innerHTML = `<div class="alerta alerta-erro">${erro.message}</div>`;
  }
}

formLancamento.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  modalAlerta.innerHTML = '';

  const id = document.getElementById('lancamentoId').value;
  const corpo = {
    tipo: document.getElementById('tipo').value,
    descricao: document.getElementById('descricao').value.trim(),
    valor: Number(document.getElementById('valor').value),
    data: document.getElementById('data').value,
    categoria_id: document.getElementById('categoria_id').value || null,
  };

  try {
    if (id) {
      await api(`/lancamentos/${id}`, { method: 'PUT', body: JSON.stringify(corpo) });
    } else {
      await api('/lancamentos', { method: 'POST', body: JSON.stringify(corpo) });
    }
    fecharModal();
    carregarLancamentos();
  } catch (erro) {
    modalAlerta.innerHTML = `<div class="alerta alerta-erro">${erro.message}</div>`;
  }
});

document.getElementById('btnNovo').addEventListener('click', abrirModalNovo);
document.getElementById('btnCancelar').addEventListener('click', fecharModal);
document.getElementById('btnFiltrar').addEventListener('click', carregarLancamentos);
document.getElementById('btnLimparFiltro').addEventListener('click', () => {
  document.getElementById('filtroInicio').value = '';
  document.getElementById('filtroFim').value = '';
  document.getElementById('filtroTipo').value = '';
  document.getElementById('filtroCategoria').value = '';
  carregarLancamentos();
});

(async function iniciar() {
  await carregarCategorias();
  await carregarLancamentos();
})();
