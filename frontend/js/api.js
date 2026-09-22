const API_BASE = '/api';

const Sessao = {
  salvar(token, usuario) {
    localStorage.setItem('pf_token', token);
    localStorage.setItem('pf_usuario', JSON.stringify(usuario));
  },
  token() {
    return localStorage.getItem('pf_token');
  },
  usuario() {
    const raw = localStorage.getItem('pf_usuario');
    return raw ? JSON.parse(raw) : null;
  },
  limpar() {
    localStorage.removeItem('pf_token');
    localStorage.removeItem('pf_usuario');
  },
  exigirLogin() {
    if (!this.token()) {
      window.location.href = 'index.html';
    }
  },
};

async function api(caminho, opcoes = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opcoes.headers || {}) };
  const token = Sessao.token();
  if (token) headers.Authorization = `Bearer ${token}`;

  const resposta = await fetch(`${API_BASE}${caminho}`, { ...opcoes, headers });

  if (resposta.status === 401) {
    Sessao.limpar();
    window.location.href = 'index.html';
    return;
  }

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.erro || 'Ocorreu um erro inesperado.');
  }
  return dados;
}

function formatarMoeda(valor, moeda = 'BRL') {
  const numero = Number(valor) || 0;
  try {
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: moeda });
  } catch {
    return `R$ ${numero.toFixed(2)}`;
  }
}

function formatarData(data) {
  if (!data) return '-';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}
