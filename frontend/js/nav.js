// Cores das cédulas do Real (R$100, R$5, R$20, R$2, R$50, R$10), usadas nos gráficos
const CORES_GRAFICO = ['#2e7f7a', '#7b5a9b', '#d9952a', '#5c7a8c', '#9a6a3a', '#b5412f', '#3d6670', '#8a969b'];

function corCss(variavel) {
  return getComputedStyle(document.documentElement).getPropertyValue(variavel).trim();
}

// Textos e grades dos gráficos acompanham o tema atual
function aplicarPadraoGraficos() {
  if (!window.Chart) return;
  Chart.defaults.font.family = '"Public Sans", "Segoe UI", sans-serif';
  Chart.defaults.color = corCss('--tinta-suave');
  Chart.defaults.borderColor = corCss('--linha');
}
aplicarPadraoGraficos();

/* ---------- Tema claro / escuro ---------- */
function temaAtual() {
  return document.documentElement.dataset.tema === 'escuro' ? 'escuro' : 'claro';
}

function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  try {
    localStorage.setItem('pf_tema', tema);
  } catch (e) {
    // sem armazenamento disponível: o tema vale só para esta visita
  }
  atualizarSeletorTema();
  aplicarPadraoGraficos();
  if (window.Chart) Object.values(Chart.instances).forEach((g) => g.update('none'));
}

function trocarTema(tema) {
  if (tema === temaAtual()) return;
  const raiz = document.documentElement;
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    raiz.classList.add('trocando-tema');
    document.startViewTransition(() => aplicarTema(tema)).finished.finally(() => raiz.classList.remove('trocando-tema'));
  } else {
    aplicarTema(tema);
  }
}

function atualizarSeletorTema() {
  const tema = temaAtual();
  const rotulo = document.getElementById('temaRotulo');
  if (rotulo) rotulo.textContent = tema === 'escuro' ? 'Escuro' : 'Claro';
  document.querySelectorAll('.tema-opcao').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tema === tema)));
}

const LINKS_MENU = [
  { href: 'dashboard.html', id: 'dashboard', rotulo: 'Dashboard' },
  { href: 'lancamentos.html', id: 'lancamentos', rotulo: 'Lançamentos' },
  { href: 'metas.html', id: 'metas', rotulo: 'Metas' },
  { href: 'orcamento.html', id: 'orcamento', rotulo: 'Orçamento' },
  { href: 'relatorios.html', id: 'relatorios', rotulo: 'Relatórios' },
  { href: 'perfil.html', id: 'perfil', rotulo: 'Perfil' },
];

function montarSidebar(paginaAtiva) {
  const linksHtml = LINKS_MENU
    .map(
      (l) =>
        `<a href="${l.href}" data-pagina="${l.id}" class="${l.id === paginaAtiva ? 'ativo' : ''}">${l.rotulo}</a>`
    )
    .join('');

  return `
    <aside class="sidebar">
      <div class="logo-mini">Planejamento<br>Financeiro</div>
      <nav>${linksHtml}</nav>
      <div class="sair">
        <div class="tema">
          <button type="button" class="tema-botao" aria-haspopup="true">Tema <span id="temaRotulo"></span></button>
          <div class="tema-opcoes" role="group" aria-label="Tema">
            <button type="button" class="tema-opcao" data-tema="claro"><span class="amostra-tema amostra-claro"></span>Claro</button>
            <button type="button" class="tema-opcao" data-tema="escuro"><span class="amostra-tema amostra-escuro"></span>Escuro</button>
          </div>
        </div>
        <button class="btn btn-secundario btn-bloco" id="btnSair"></button>
      </div>
    </aside>
  `;
}

// Chamado por cada página. O menu é montado uma única vez; nas trocas seguintes só muda o item ativo.
function iniciarLayout(paginaAtiva) {
  Sessao.exigirLogin();
  const container = document.getElementById('sidebar-container');

  if (!container.querySelector('.sidebar')) {
    container.innerHTML = montarSidebar(paginaAtiva);
    document.getElementById('btnSair').addEventListener('click', async () => {
      try {
        await api('/auth/logout', { method: 'POST' });
      } catch (e) {
        // segue o logout mesmo se a chamada falhar
      }
      Sessao.limpar();
      window.location.href = 'index.html';
    });
    container.querySelectorAll('.tema-opcao').forEach((b) => {
      b.addEventListener('click', () => trocarTema(b.dataset.tema));
    });
    atualizarSeletorTema();
    iniciarNavegacao();
  }

  container.querySelectorAll('nav a').forEach((a) => {
    a.classList.toggle('ativo', a.dataset.pagina === paginaAtiva);
  });

  const usuario = Sessao.usuario();
  document.getElementById('btnSair').textContent = `Sair (${usuario ? usuario.nome.split(' ')[0] : ''})`;
}

/* ---------- Navegação sem recarregar a página ----------
   Ao clicar no menu, busca o HTML da outra página, troca só o <main> e os modais,
   e executa o script daquela página. O menu lateral permanece intacto. */

const PAGINAS_APP = LINKS_MENU.map((l) => l.href);
const SCRIPTS_COMPARTILHADOS = ['js/tema.js', 'js/api.js', 'js/nav.js'];
const cacheTextos = new Map();
let navegacaoAtual = 0;

function buscarTexto(url) {
  if (!cacheTextos.has(url)) {
    const pedido = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`Falha ao carregar ${url}`);
      return r.text();
    });
    pedido.catch(() => cacheTextos.delete(url));
    cacheTextos.set(url, pedido);
  }
  return cacheTextos.get(url);
}

function carregarScriptExterno(src) {
  if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function paginaDaUrl(url) {
  return new URL(url, location.href).pathname.split('/').pop() || 'index.html';
}

async function navegar(pagina, { empilhar = true } = {}) {
  const id = ++navegacaoAtual;

  try {
    const doc = new DOMParser().parseFromString(await buscarTexto(pagina), 'text/html');
    const novoMain = doc.querySelector('main.conteudo');
    if (!novoMain) throw new Error('Página sem conteúdo');

    const srcs = [...doc.querySelectorAll('script[src]')].map((s) => s.getAttribute('src'));
    const externos = srcs.filter((s) => /^https?:/.test(s));
    const proprios = srcs.filter((s) => !/^https?:/.test(s) && !SCRIPTS_COMPARTILHADOS.includes(s));

    await Promise.all(externos.map(carregarScriptExterno));
    aplicarPadraoGraficos();
    const codigos = await Promise.all(proprios.map(buscarTexto));

    if (id !== navegacaoAtual) return; // o usuário já clicou em outra página

    const trocar = () => {
      if (window.Chart) Object.values(Chart.instances).forEach((g) => g.destroy());
      document.querySelector('main.conteudo').replaceWith(document.importNode(novoMain, true));
      document.querySelectorAll('body > .modal-fundo').forEach((m) => m.remove());
      doc.querySelectorAll('body > .modal-fundo').forEach((m) => document.body.appendChild(document.importNode(m, true)));
      document.title = doc.title;
      window.scrollTo(0, 0);

      // Cada script roda em seu próprio escopo para não colidir com as variáveis da página anterior
      codigos.forEach((codigo, i) => new Function(`${codigo}\n//# sourceURL=${proprios[i]}`)());
    };

    if (empilhar) history.pushState({ pagina }, '', pagina);

    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(trocar);
    } else {
      trocar();
    }
  } catch (erro) {
    // Se algo falhar, cai para a navegação normal
    window.location.href = pagina;
  }
}

function iniciarNavegacao() {
  const sidebar = document.querySelector('.sidebar');

  sidebar.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    const pagina = paginaDaUrl(link.href);
    if (!PAGINAS_APP.includes(pagina)) return;

    e.preventDefault();
    if (pagina === paginaDaUrl(location.href)) return;
    navegar(pagina);
  });

  // Pré-carrega a página ao passar o mouse, para a troca ser instantânea
  const preCarregar = (e) => {
    const link = e.target.closest('a[href]');
    if (link && PAGINAS_APP.includes(paginaDaUrl(link.href))) buscarTexto(paginaDaUrl(link.href)).catch(() => {});
  };
  sidebar.addEventListener('pointerover', preCarregar);
  sidebar.addEventListener('focusin', preCarregar);

  window.addEventListener('popstate', () => {
    const pagina = paginaDaUrl(location.href);
    if (PAGINAS_APP.includes(pagina)) navegar(pagina, { empilhar: false });
  });
}
