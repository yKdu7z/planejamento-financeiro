if (Sessao.token()) window.location.href = 'dashboard.html';

const areaAlerta = document.getElementById('areaAlerta');

document.getElementById('formLogin').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  areaAlerta.innerHTML = '';

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;

  try {
    const dados = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });
    Sessao.salvar(dados.token, dados.usuario);
    window.location.href = 'dashboard.html';
  } catch (erro) {
    areaAlerta.innerHTML = `<div class="alerta alerta-erro">${erro.message}</div>`;
  }
});
