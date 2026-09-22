function montarSidebar(paginaAtiva) {
  const usuario = Sessao.usuario();
  const links = [
    { href: 'dashboard.html', id: 'dashboard', rotulo: 'Dashboard', icone: '📊' },
    { href: 'lancamentos.html', id: 'lancamentos', rotulo: 'Lançamentos', icone: '💰' },
    { href: 'metas.html', id: 'metas', rotulo: 'Metas', icone: '🎯' },
    { href: 'orcamento.html', id: 'orcamento', rotulo: 'Orçamento', icone: '📌' },
    { href: 'relatorios.html', id: 'relatorios', rotulo: 'Relatórios', icone: '📈' },
    { href: 'perfil.html', id: 'perfil', rotulo: 'Perfil', icone: '⚙️' },
  ];

  const linksHtml = links
    .map(
      (l) =>
        `<a href="${l.href}" class="${l.id === paginaAtiva ? 'ativo' : ''}">${l.icone} ${l.rotulo}</a>`
    )
    .join('');

  return `
    <aside class="sidebar">
      <div class="logo-mini"><span class="icone">$</span> Planejamento Financeiro</div>
      <nav>${linksHtml}</nav>
      <div class="sair">
        <button class="btn btn-secundario btn-bloco" id="btnSair">Sair (${usuario ? usuario.nome.split(' ')[0] : ''})</button>
      </div>
    </aside>
  `;
}

function iniciarLayout(paginaAtiva) {
  Sessao.exigirLogin();
  document.getElementById('sidebar-container').innerHTML = montarSidebar(paginaAtiva);
  document.getElementById('btnSair').addEventListener('click', async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch (e) {
      // segue o logout mesmo se a chamada falhar
    }
    Sessao.limpar();
    window.location.href = 'index.html';
  });
}
