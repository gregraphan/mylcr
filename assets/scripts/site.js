const siteHeader = document.querySelector('[data-site-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const menuPanel = menuToggle
  ? document.getElementById(menuToggle.getAttribute('aria-controls'))
  : null;
const menuLabel = menuToggle?.querySelector('[data-menu-label]');

if (siteHeader && menuToggle && menuPanel) {
  const firstMenuLink = menuPanel.querySelector('a[href]');

  const menuIsOpen = () => menuToggle.getAttribute('aria-expanded') === 'true';

  const updateMenuPosition = () => {
    const top = Math.max(0, Math.ceil(siteHeader.getBoundingClientRect().bottom));
    menuPanel.style.setProperty('--mobile-menu-top', `${top}px`);
  };

  const openMenu = () => {
    updateMenuPosition();
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');
    if (menuLabel) menuLabel.textContent = 'Close';
    menuPanel.setAttribute('data-open', '');
    document.body.classList.add('menu-open');
    requestAnimationFrame(() => firstMenuLink?.focus());
  };

  const closeMenu = ({ returnFocus = true } = {}) => {
    if (!menuIsOpen()) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    if (menuLabel) menuLabel.textContent = 'Menu';
    menuPanel.removeAttribute('data-open');
    document.body.classList.remove('menu-open');
    if (returnFocus) menuToggle.focus();
  };

  menuToggle.addEventListener('click', () => {
    if (menuIsOpen()) closeMenu();
    else openMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuIsOpen()) {
      event.preventDefault();
      closeMenu();
    }
  });

  document.addEventListener('click', (event) => {
    if (menuIsOpen() && !siteHeader.contains(event.target)) closeMenu();
  });

  const desktopQuery = window.matchMedia('(min-width: 70.01rem)');
  desktopQuery.addEventListener('change', (event) => {
    if (event.matches) closeMenu({ returnFocus: false });
  });

  window.addEventListener('resize', () => {
    if (menuIsOpen()) updateMenuPosition();
  });

  window.visualViewport?.addEventListener('resize', () => {
    if (menuIsOpen()) updateMenuPosition();
  });
}

const searchForm = document.querySelector('[data-site-search]');

if (searchForm) {
  const queryInput = searchForm.querySelector('input[name="q"]');
  const status = searchForm.querySelector('[data-search-status]');
  const entries = [...document.querySelectorAll('[data-search-entry]')];
  const indexData = document.getElementById('search-index-data');
  let indexItems = [];

  try {
    const parsed = JSON.parse(indexData?.textContent || '{}');
    if (Array.isArray(parsed.items)) indexItems = parsed.items;
  } catch {
    indexItems = [];
  }

  const normalized = (value) => String(value || '').trim().toLocaleLowerCase();
  const indexByPath = new Map(indexItems.map((item) => [item.path, item]));
  const searchableEntries = entries.map((entry) => ({
    entry,
    item: indexByPath.get(entry.dataset.searchPath),
  }));

  const updateResults = (rawQuery, { updateUrl = false } = {}) => {
    const query = normalized(rawQuery);
    let visible = 0;
    for (const { entry, item } of searchableEntries) {
      const searchableText = item ? `${item.title} ${item.description} ${item.text}` : '';
      const matches = !query || normalized(searchableText).includes(query);
      entry.hidden = !matches;
      if (matches) visible += 1;
    }
    if (status) {
      status.textContent = query
        ? `${visible} ${visible === 1 ? 'page' : 'pages'} found for “${rawQuery.trim()}”.`
        : `Showing all ${entries.length} pages.`;
    }
    if (updateUrl) {
      const url = new URL(window.location.href);
      if (query) url.searchParams.set('q', rawQuery.trim());
      else url.searchParams.delete('q');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
  };

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    updateResults(queryInput?.value || '', { updateUrl: true });
  });

  searchForm.addEventListener('reset', () => {
    requestAnimationFrame(() => updateResults('', { updateUrl: true }));
  });

  const initialQuery = new URLSearchParams(window.location.search).get('q') || '';
  if (queryInput) queryInput.value = initialQuery;
  if (indexItems.length === entries.length && searchableEntries.every(({ item }) => item)) updateResults(initialQuery);
}
