try {
  const temaSalvo = localStorage.getItem('pf_tema');
  document.documentElement.dataset.tema =
    temaSalvo || (matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro');
} catch (e) {
  // sem armazenamento disponível: fica o tema claro padrão
}
