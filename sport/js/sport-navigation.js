/* Navigation directe vers les vues existantes de RUN // DATA. */
(() => {
  const allowed = new Set(['dashboard', 'performance', 'training', 'strava']);
  const requested = new URLSearchParams(location.search).get('tab');
  if (allowed.has(requested)) {
    const button = document.querySelector('.tab[data-tab="' + requested + '"]');
    if (button) button.click();
  }
  document.querySelectorAll('.tabs .tab').forEach(button => {
    button.addEventListener('click', () => {
      const url = new URL(location.href);
      if (button.dataset.tab === 'dashboard') url.searchParams.delete('tab');
      else url.searchParams.set('tab', button.dataset.tab);
      history.replaceState({}, '', url.pathname + url.search + url.hash);
    });
  });
})();
