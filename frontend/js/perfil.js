iniciarLayout('perfil');

const areaAlerta = document.getElementById('areaAlerta');

async function carregarPerfil() {
  try {
    const dados = await api('/auth/perfil');
    document.getElementById('nome').value = dados.nome;
    document.getElementById('email').value = dados.email;
    document.getElementById('salario').value = dados.salario;
    document.getElementById('moeda').value = dados.moeda;
  } catch (erro) {
    areaAlerta.innerHTML = `<div class="alerta alerta-erro">${erro.message}</div>`;
  }
}

document.getElementById('formPerfil').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  areaAlerta.innerHTML = '';

  const corpo = {
    nome: document.getElementById('nome').value.trim(),
    salario: Number(document.getElementById('salario').value) || 0,
    moeda: document.getElementById('moeda').value,
  };
  const novaSenha = document.getElementById('novaSenha').value;
  if (novaSenha) corpo.senha = novaSenha;

  try {
    await api('/auth/perfil', { method: 'PUT', body: JSON.stringify(corpo) });

    const usuarioAtual = Sessao.usuario();
    Sessao.salvar(Sessao.token(), { ...usuarioAtual, nome: corpo.nome, salario: corpo.salario, moeda: corpo.moeda });

    document.getElementById('novaSenha').value = '';
    areaAlerta.innerHTML = '<div class="alerta alerta-sucesso">Perfil atualizado com sucesso.</div>';
  } catch (erro) {
    areaAlerta.innerHTML = `<div class="alerta alerta-erro">${erro.message}</div>`;
  }
});

carregarPerfil();
