if (Sessao.token()) window.location.href = 'dashboard.html';

const areaAlerta = document.getElementById('areaAlerta');

document.getElementById('formCadastro').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  areaAlerta.innerHTML = '';

  const corpo = {
    nome: document.getElementById('nome').value.trim(),
    email: document.getElementById('email').value.trim(),
    senha: document.getElementById('senha').value,
    moeda: document.getElementById('moeda').value,
    salario: Number(document.getElementById('salario').value) || 0,
  };

  try {
    const dados = await api('/auth/cadastro', {
      method: 'POST',
      body: JSON.stringify(corpo),
    });
    Sessao.salvar(dados.token, dados.usuario);
    window.location.href = 'dashboard.html';
  } catch (erro) {
    areaAlerta.innerHTML = `<div class="alerta alerta-erro">${erro.message}</div>`;
  }
});
