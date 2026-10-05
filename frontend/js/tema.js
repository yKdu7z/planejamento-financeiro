// Aplica o tema salvo (claro/escuro) antes da página aparecer, para não piscar no tema errado.
// Carregado no <head> de todas as páginas. A troca de tema fica em nav.js.
try {
  const temaSalvo = localStorage.getItem('pf_tema');
  document.documentElement.dataset.tema =
    temaSalvo || (matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro');
} catch (e) {
  // sem armazenamento disponível: fica o tema claro padrão
}
