// Back-end em PHP: /web2/backend/... (caminho relativo à pasta do site)
const API_BASE = 'backend';

// Quem está logado é controlado pela sessão do PHP (cookie).
// Aqui guardamos só os dados do usuário para exibir na tela (nome, moeda).
const Sessao = {
  salvar(usuario) {
    localStorage.setItem('pf_usuario', JSON.stringify(usuario));
  },
  logado() {
    return Boolean(localStorage.getItem('pf_usuario'));
  },
  usuario() {
    const raw = localStorage.getItem('pf_usuario');
    return raw ? JSON.parse(raw) : null;
  },
  limpar() {
    localStorage.removeItem('pf_usuario');
  },
  exigirLogin() {
    if (!this.logado()) {
      window.location.href = 'index.html';
    }
  },
};

async function api(caminho, opcoes = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opcoes.headers || {}) };

  const resposta = await fetch(`${API_BASE}${caminho}`, { ...opcoes, headers, credentials: 'same-origin' });

  // Sessão expirada: volta para o login (exceto na própria tentativa de login)
  if (resposta.status === 401 && caminho !== '/auth/login') {
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
