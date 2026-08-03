// Shared nav builder. Avoids duplicating the sidebar markup in every page.
// Pages set <body data-page="index|arch|db|..."> and call buildNav(); the
// matching <a> gets .active. Search box filters the visible links by
// typed substring (case-insensitive across link text + data-tags).

const NAV_GROUPS = [
  {
    title: "Overview",
    items: [
      { href: "index.html",                 label: "Home",                 tags: "intro landing" },
      { href: "pages/architecture.html",    label: "Architecture",          tags: "overview big-picture dataflow" },
      { href: "pages/db-schema.html",       label: "Kodi DB schema",       tags: "mariadb tvshow episode path files" },
      { href: "pages/provider-matrix.html", label: "Provider matrix",      tags: "comparison bbc itvx my5 c4 stv blaze" },
      { href: "pages/troubleshooting.html", label: "Troubleshooting",      tags: "known issues fixes" },
    ],
  },
  {
    title: "Entry points",
    items: [
      { href: "files/default-py.html",  label: "default.py",   tags: "plugin entry routing resolve_vod" },
      { href: "files/service-py.html",  label: "service.py",   tags: "scheduled sync daemon monitor" },
    ],
  },
  {
    title: "Core engine",
    items: [
      { href: "files/library_sync-py.html", label: "library_sync.py", tags: "sync tmdb insert tvshow episode" },
      { href: "files/strm-py.html",          label: "strm.py",          tags: "url builder fetch shows" },
      { href: "files/init-py.html",          label: "__init__.py",     tags: "shared setup_dash_item provider_map" },
      { href: "files/genres-py.html",         label: "genres.py",       tags: "unified genres provider labels" },
      { href: "files/catalog_check-py.html", label: "catalog_check.py", tags: "stale titles mark" },
    ],
  },
  {
    title: "Providers — live",
    items: [
      { href: "files/bbc-py.html",   label: "bbc.py",   tags: "live mediaselector" },
      { href: "files/itvx-py.html",  label: "itvx.py",  tags: "live auth jwt session" },
      { href: "files/c4-py.html",    label: "c4.py",    tags: "live simulcast widevine" },
      { href: "files/stv-py.html",   label: "stv.py",   tags: "live stv drm" },
      { href: "files/blaze-py.html", label: "blaze.py", tags: "live hls" },
      { href: "files/sky-py.html",   label: "sky.py",   tags: "live news brightcove" },
    ],
  },
  {
    title: "Providers — VOD",
    items: [
      { href: "files/bbc_vod-py.html",   label: "bbc_vod.py",   tags: "iplayer redux scraper" },
      { href: "files/itvx_vod-py.html",  label: "itvx_vod.py",  tags: "fetch series episodes" },
      { href: "files/c4_vod-py.html",    label: "c4_vod.py",    tags: "channel4 brand params" },
      { href: "files/my5_vod-py.html",   label: "my5_vod.py",   tags: "corona api" },
      { href: "files/stv_vod-py.html",   label: "stv_vod.py",   tags: "stv episodes" },
      { href: "files/blaze_vod-py.html", label: "blaze_vod.py", tags: "blaze episodes html scrap" },
      { href: "files/c4-py.html",        label: "c4.py (resolve_vod)", tags: "channel4 resolve widevine licence" },
      { href: "files/my5-py.html",       label: "my5.py",        tags: "cassie hmac aes keys" },
    ],
  },
];

function buildNav() {
  const nav = document.querySelector('nav.sidebar');
  if (!nav) return;
  // Determine the current page's href as it appears in NAV_GROUPS:
  // index.html  -> "index.html"
  // pages/x.html -> "pages/x.html"
  // files/x-py.html -> "files/x-py.html"
  const path = location.pathname.replace(/\/$/, '');
  const basename = path.split('/').pop() || 'index.html';
  let currentHref = basename;
  if (basename !== 'index.html') {
    // We're in a subdir; figure out which one.
    const parts = path.split('/');
    if (parts.length >= 2) {
      const dir = parts[parts.length - 2];
      currentHref = dir + '/' + basename;
    }
  }
  nav.innerHTML = `
    <a class="brand" href="${resolveHref('index.html')}">EasyPlayTV docs</a>
    <input type="search" class="search" placeholder="Filter nav…" aria-label="Filter navigation" autocomplete="off">
    ${NAV_GROUPS.map(g => `
      <div class="group" data-group>
        <h3>${g.title}</h3>
        ${g.items.map(it => {
          const active = (it.href === currentHref) ? ' active' : '';
          // resolve relative to current page's depth
          const href = resolveHref(it.href);
          return `<a href="${href}" data-label="${it.label.toLowerCase()}" data-tags="${it.tags}" class="${active}">${it.label}</a>`;
        }).join('')}
      </div>
    `).join('')}
  `;
  const search = nav.querySelector('.search');
  search.addEventListener('input', filterNav);
  // Preserve search across pages via ?q=
  const params = new URLSearchParams(location.search);
  if (params.get('q')) {
    search.value = params.get('q');
    filterNav();
  }
}

function resolveHref(href) {
  // Pages live in / (index, pages/, files/) so we need to bump relative
  // links accordingly depending on the current page's directory.
  const path = location.pathname;
  if (path.endsWith('/pages/') || path.includes('/pages/')) return '../' + href;
  if (path.endsWith('/files/') || path.includes('/files/')) return '../' + href;
  return href;
}

function filterNav() {
  const q = (document.querySelector('nav.sidebar .search').value || '').toLowerCase().trim();
  document.querySelectorAll('nav.sidebar a[data-label]').forEach(a => {
    const label = a.dataset.label || '';
    const tags = a.dataset.tags || '';
    const match = !q || label.includes(q) || tags.includes(q);
    a.classList.toggle('hidden-by-search', !match);
  });
  document.querySelectorAll('nav.sidebar .group[data-group]').forEach(g => {
    const anyVisible = g.querySelector('a:not(.hidden-by-search)');
    g.style.display = anyVisible ? '' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', buildNav);
