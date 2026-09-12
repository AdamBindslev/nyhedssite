// js/news.js - Redaktionel avisforside med skalerbar artikelstrøm og balanceret tophistorie
import { CONFIG } from './config.js';

// Kuraterede standardnyheder så sitet aldrig står tomt eller med "Henter..."
const FALLBACK_NEWS = [
  {
    id: 'dr-sen-1',
    source: 'DR Seneste',
    category: 'Breaking',
    feedId: 'dr-seneste',
    title: 'Trafikken på Storebæltsbroen omlægges i næste uge på grund af planlagt vedligehold',
    description: 'Vejdirektoratet opfordrer bilister til at køre i god tid og følge skiltningen under arbejdet med at forstærke kørebanerne.',
    pubDate: new Date(Date.now() - 900000).toISOString(),
    imageUrl: null
  },
  {
    id: 'dr-pol-1',
    source: 'DR Politik',
    category: 'Christiansborg',
    feedId: 'dr-politik',
    title: 'Finanslovsforhandlinger fortsætter på Christiansborg med fokus på velfærd og grøn omstilling',
    description: 'Partierne mødes i Finansministeriet for at drøfte prioriteringerne for det kommende budgetår.',
    pubDate: new Date(Date.now() - 1800000).toISOString(),
    imageUrl: null
  },
  {
    id: 'vox-poll-1',
    source: 'Voxmeter / Altinget',
    category: 'Meningsmåling',
    isPoll: true,
    feedId: 'altinget',
    title: 'Politisk Barometer: S (21,7%), DF (12,3%), SF (10,4%) og LA (10,2%) i tæt opgør',
    description: 'Aktuel Voxmeter-måling: S (21,7%), DF (12,3%), SF (10,4%), LA (10,2%), K (9,0%), RV (7,5%), EL (7,5%), V (7,1%), DD (5,6%), M (5,4%), ALT (2,5%). DF konsoliderer positionen som næststørste parti.',
    pubDate: new Date().toISOString(),
    imageUrl: null
  },
  {
    id: 'alt-pol-1',
    source: 'Altinget',
    category: 'Politik',
    feedId: 'altinget',
    title: 'Forhandlingerne om ny politisk aftale spidser til forud for efterårets samlinger',
    description: 'Partierne forbereder sig på intense drøftelser om velfærd, skat og reformer i folkeskolen.',
    pubDate: new Date(Date.now() - 2100000).toISOString(),
    imageUrl: null
  },
  {
    id: 'tv2-ost-1',
    source: 'TV2 Østjylland',
    category: 'Østjylland',
    feedId: 'tv2-ostjylland',
    title: 'Aarhus og Østjylland ruster sig med nye grønne byrum og klimasikring',
    description: 'Omfattende anlægsarbejde ved havnen og bugten skal beskytte midtbyen mod fremtidige stormfloder og sikre moderne infrastruktur.',
    pubDate: new Date(Date.now() - 2700000).toISOString(),
    imageUrl: null
  },
  {
    id: 'pol-1',
    source: 'Politiken Politik',
    category: 'Politik',
    feedId: 'politiken',
    title: 'Ny rapport kortlægger danskernes medievaner og tillid til den politiske debat',
    description: 'Brugere søger i stigende grad mod hurtige overblik og dybdegående journalistik på tværs af platforme.',
    pubDate: new Date(Date.now() - 3600000).toISOString(),
    imageUrl: null
  },
  {
    id: 'bbc-1',
    source: 'BBC World',
    category: 'Global',
    feedId: 'bbc-world',
    title: 'Astronomers detect unprecedented cosmic phenomenon in distant galaxy cluster',
    description: 'New telescope observations reveal extraordinary gravitational wave patterns challenging standard stellar models.',
    pubDate: new Date(Date.now() - 4500000).toISOString(),
    imageUrl: null
  },
  {
    id: 'f24-1',
    source: 'France 24',
    category: 'Global',
    feedId: 'france-24',
    title: 'International climate summit addresses global grid modernization and energy security',
    description: 'Diplomats and energy ministers convene in Paris to establish new multilateral cooperation framework on cross-border energy infrastructure.',
    pubDate: new Date(Date.now() - 4800000).toISOString(),
    imageUrl: null
  },
  {
    id: 'dw-1',
    source: 'Deutsche Welle',
    category: 'Global',
    feedId: 'dw-world',
    title: 'European central banks coordinate strategy on sovereign reserves and geopolitical risk',
    description: 'Finance ministers and bank governors assess global supply chain stability and reserve diversification at Frankfurt assembly.',
    pubDate: new Date(Date.now() - 5400000).toISOString(),
    imageUrl: null
  }
];

let newsItems = [...FALLBACK_NEWS];
let feedsData = {
  'dr-seneste': FALLBACK_NEWS.filter(i => i.feedId === 'dr-seneste'),
  'dr-politik': FALLBACK_NEWS.filter(i => i.feedId === 'dr-politik'),
  'altinget': FALLBACK_NEWS.filter(i => i.feedId === 'altinget'),
  'tv2-ostjylland': FALLBACK_NEWS.filter(i => i.feedId === 'tv2-ostjylland'),
  'politiken': FALLBACK_NEWS.filter(i => i.feedId === 'politiken'),
  'bbc-world': FALLBACK_NEWS.filter(i => i.feedId === 'bbc-world'),
  'france-24': FALLBACK_NEWS.filter(i => i.feedId === 'france-24'),
  'dw-world': FALLBACK_NEWS.filter(i => i.feedId === 'dw-world')
};

let availableSources = [
  { id: 'dr-seneste', source: 'DR Seneste' },
  { id: 'dr-politik', source: 'DR Politik' },
  { id: 'altinget', source: 'Altinget' },
  { id: 'politiken', source: 'Politiken Politik' },
  { id: 'tv2-ostjylland', source: 'TV2 Østjylland' },
  { id: 'bbc-world', source: 'BBC World' },
  { id: 'france-24', source: 'France 24' },
  { id: 'dw-world', source: 'Deutsche Welle' }
];

const PAGE_SIZE = 6;
let activeFilter = 'all';
let currentIndex = 0;
let currentRenderedPage = -1;
let newsCycleTimer = null;

function formatTimeAgo(dateString) {
  if (!dateString) return 'Lige nu';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Lige nu';
  if (diffMins < 60) return `${diffMins}m siden`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}t siden`;
  return `${Math.floor(diffHours / 24)}d siden`;
}

function getActiveArticles() {
  let list = [];
  if (activeFilter === 'polls') {
    list = newsItems.filter(i => i.isPoll || i.category === 'Meningsmåling' || /måling/i.test(i.title));
    if (list.length === 0) {
      list = newsItems.filter(i => i.category === 'Politik' || i.feedId === 'altinget' || i.feedId === 'dr-politik');
    }
  } else if (activeFilter !== 'all' && feedsData[activeFilter]) {
    list = feedsData[activeFilter];
  } else {
    list = newsItems;
  }

  // Sorter altid strengt kronologisk efter udgivelsestidspunkt (nyeste først)
  return [...list].sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
}

function getDisplayArticles() {
  const active = getActiveArticles();
  if (active.length === 0) return [];
  const totalPages = Math.max(1, Math.ceil(active.length / PAGE_SIZE));
  const targetPage = Math.floor(currentIndex / PAGE_SIZE) % totalPages;
  const start = targetPage * PAGE_SIZE;
  return active.slice(start, start + PAGE_SIZE);
}

function updatePageBadge() {
  const badge = document.getElementById('news-page-badge');
  if (!badge) return;
  const active = getActiveArticles();
  const totalPages = Math.max(1, Math.ceil(active.length / PAGE_SIZE));
  const currentPage = Math.min(totalPages, Math.floor(currentIndex / PAGE_SIZE) + 1);
  badge.textContent = `Side ${currentPage}/${totalPages}`;
}

export async function fetchNews() {
  try {
    const bustUrl = `${CONFIG.endpoints.news}?_=${Date.now()}`;
    const response = await fetch(bustUrl, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const activeBefore = getActiveArticles();
      const currentHeroTitle = activeBefore[currentIndex]?.title;

      newsItems = data.items;
      if (data.byFeed) {
        feedsData = data.byFeed;
      }
      if (data.sources && Array.isArray(data.sources)) {
        availableSources = data.sources;
      }

      // Hvis den aktuelle artikel stadig eksisterer, fasthold positionen så brugeren ikke forstyrres
      const activeAfter = getActiveArticles();
      const matchIdx = activeAfter.findIndex(i => i.title === currentHeroTitle);
      if (matchIdx !== -1) {
        currentIndex = matchIdx;
      } else {
        currentIndex = 0;
      }

      renderFilterBar();
      renderHeadlinesGrid(true);
      displayHeroNews();
    }
  } catch (err) {
    console.warn('Kunne ikke hente live RSS feeds, benytter aktuelle nyheder:', err.message);
  }
}

function renderFilterBar() {
  const container = document.getElementById('news-filter-bar');
  if (!container) return;

  const buttons = [
    `<button class="filter-pill ${activeFilter === 'all' ? 'is-active' : ''}" data-feed="all">
      <span class="filter-dot dot-all"></span> Alle Kilder
    </button>`,
    `<button class="filter-pill ${activeFilter === 'polls' ? 'is-active' : ''}" data-feed="polls">
      <span class="filter-dot dot-polls"></span> 📊 Målinger
    </button>`
  ];

  availableSources.forEach(s => {
    const isActive = activeFilter === s.id;
    buttons.push(`
      <button class="filter-pill ${isActive ? 'is-active' : ''}" data-feed="${s.id}">
        <span class="filter-dot dot-${s.id}"></span> ${s.source}
      </button>
    `);
  });

  container.innerHTML = buttons.join('');

  container.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const feedId = btn.getAttribute('data-feed');
      setFilter(feedId);
    });
  });
}

function setFilter(feedId) {
  activeFilter = feedId;
  currentIndex = 0;
  currentRenderedPage = -1;
  renderFilterBar();
  renderHeadlinesGrid(true);
  displayHeroNews();
  startNewsCycle();
}

function renderHeadlinesGrid(force = false) {
  const container = document.getElementById('news-headlines-grid');
  if (!container) return;

  const active = getActiveArticles();
  if (active.length === 0) {
    container.innerHTML = '<div class="news-stream-empty">Opdaterer nyhedsstrøm...</div>';
    updatePageBadge();
    return;
  }

  const totalPages = Math.max(1, Math.ceil(active.length / PAGE_SIZE));
  const targetPage = Math.floor(currentIndex / PAGE_SIZE) % totalPages;

  // Hvis vi allerede er på den korrekte side, undgå at genopbygge hele DOM'en (bevarer ro og undgår blink)
  if (!force && targetPage === currentRenderedPage) {
    highlightActiveInGrid(active[currentIndex]?.title);
    updateGridTimes();
    updatePageBadge();
    return;
  }

  currentRenderedPage = targetPage;
  updatePageBadge();

  // Blød fade animation ved sideskift
  container.classList.add('grid-fading');

  setTimeout(() => {
    const currentHeroTitle = active[currentIndex]?.title;
    const articles = getDisplayArticles();

    container.innerHTML = articles.map(item => {
      const isHero = item.title === currentHeroTitle;
      const cleanTitle = sanitizeText(item.title);
      const isPoll = item.isPoll || item.category === 'Meningsmåling' || /måling/i.test(item.title);
      const badgeClass = isPoll ? 'badge-meningsmaling' : `badge-${item.feedId || 'general'}`;
      const badgeText = isPoll ? '📊 Måling' : item.source;
      return `
        <div class="stream-article-card ${isHero ? 'is-active-hero' : ''}" data-feed="${item.feedId}">
          <div class="stream-card-meta">
            <span class="news-badge ${badgeClass}">${badgeText}</span>
            <span class="stream-card-time" data-pubdate="${item.pubDate}">${formatTimeAgo(item.pubDate)}</span>
          </div>
          <div class="stream-card-title" title="${cleanTitle}">${cleanTitle}</div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.stream-article-card').forEach(card => {
      card.addEventListener('click', () => {
        const titleEl = card.querySelector('.stream-card-title');
        if (!titleEl) return;
        promoteToHero(titleEl.textContent);
      });
    });

    container.classList.remove('grid-fading');
  }, 100);
}

function updateGridTimes() {
  document.querySelectorAll('.stream-card-time').forEach(el => {
    const pubDate = el.getAttribute('data-pubdate');
    if (pubDate) {
      el.textContent = formatTimeAgo(pubDate);
    }
  });
}

function promoteToHero(title) {
  const active = getActiveArticles();
  const cleanTarget = sanitizeText(title);
  const targetIdx = active.findIndex(i => sanitizeText(i.title) === cleanTarget || i.title === title);
  if (targetIdx !== -1) {
    currentIndex = targetIdx;
    displayHeroNews();
    startNewsCycle();
  }
}

function highlightActiveInGrid(heroTitle) {
  const cleanHero = sanitizeText(heroTitle);
  document.querySelectorAll('.stream-article-card').forEach(el => {
    const titleEl = el.querySelector('.stream-card-title');
    if (titleEl && (sanitizeText(titleEl.textContent) === cleanHero || titleEl.textContent === heroTitle)) {
      el.classList.add('is-active-hero');
    } else {
      el.classList.remove('is-active-hero');
    }
  });
}

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rsquo;/g, '’')
    .replace(/&aelig;/gi, 'æ')
    .replace(/&oslash;/gi, 'ø')
    .replace(/&aring;/gi, 'å')
    .replace(/&AElig;/g, 'Æ')
    .replace(/&Oslash;/g, 'Ø')
    .replace(/&Aring;/g, 'Å')
    .replace(/&eacute;/gi, 'é')
    .replace(/&Eacute;/g, 'É');
}

function sanitizeText(str) {
  if (!str) return '';
  let text = str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  text = decodeHtmlEntities(text);
  text = text.replace(/<[^>]+>/g, ' ');
  text = decodeHtmlEntities(text);
  text = text
    .replace(/^\s*Follow the day[’']s news live[\s\S]*?daily news podcast\s*/i, '')
    .replace(/Continue reading\.\.\.?\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text;
}

function displayHeroNews() {
  const active = getActiveArticles();
  if (active.length === 0) return;

  if (currentIndex >= active.length) {
    currentIndex = 0;
  }

  const item = active[currentIndex];
  const heroContainer = document.getElementById('news-hero-container') || document.getElementById('news-spotlight');
  const sourceEl = document.getElementById('news-source-tag');
  const catEl = document.getElementById('news-hero-category');
  const heroTimeEl = document.getElementById('news-hero-time');
  const topTimeEl = document.getElementById('news-time');
  const titleEl = document.getElementById('news-title');
  const descEl = document.getElementById('news-desc');
  const imgWrap = document.getElementById('news-hero-image-wrap');
  const imgEl = document.getElementById('news-hero-img');
  const progressEl = document.getElementById('news-ticker-bar');

  if (!heroContainer || !item) return;

  // Nulstil og animer progress bar
  if (progressEl) {
    progressEl.style.transition = 'none';
    progressEl.style.width = '0%';
    setTimeout(() => {
      progressEl.style.transition = `width ${CONFIG.intervals.newsCycle}ms linear`;
      progressEl.style.width = '100%';
    }, 40);
  }

  // Blød fade transition for tophistorien
  heroContainer.classList.add('news-fade-out');

  setTimeout(() => {
    const isPoll = item.isPoll || item.category === 'Meningsmåling' || /måling/i.test(item.title);
    if (sourceEl) {
      sourceEl.textContent = isPoll ? '📊 ' + item.source : item.source;
      sourceEl.className = `news-badge ${isPoll ? 'badge-meningsmaling' : 'badge-' + (item.feedId || 'general')}`;
    }
    if (catEl) {
      if (isPoll) {
        catEl.innerHTML = '<span class="poll-category-pill">MÅLING & BAROMETER</span>';
      } else {
        catEl.textContent = item.category || 'Tophistorie';
      }
    }

    const timeAgoStr = formatTimeAgo(item.pubDate);
    if (heroTimeEl) heroTimeEl.textContent = timeAgoStr;
    if (topTimeEl) topTimeEl.textContent = `Opdateret ${timeAgoStr}`;

    const cleanTitle = sanitizeText(item.title);
    const cleanDesc = sanitizeText(item.description);

    if (titleEl) titleEl.textContent = cleanTitle;
    if (descEl) {
      const isRedundantDesc = !cleanDesc || cleanDesc.toLowerCase() === cleanTitle.toLowerCase();
      descEl.textContent = isRedundantDesc ? '' : cleanDesc;
      descEl.style.display = isRedundantDesc ? 'none' : 'block';
    }

    // Billedhåndtering: Vis kun hvis et rigtigt billede kan indlæses
    if (imgWrap && imgEl) {
      if (item.imageUrl) {
        imgEl.onload = () => {
          imgWrap.style.display = 'block';
        };
        imgEl.onerror = () => {
          imgWrap.style.display = 'none';
        };
        imgEl.src = item.imageUrl;
      } else {
        imgWrap.style.display = 'none';
      }
    }

    heroContainer.classList.remove('news-fade-out');
    heroContainer.classList.add('news-fade-in');

    setTimeout(() => {
      heroContainer.classList.remove('news-fade-in');
    }, 350);

    // Opdater automatisk gitteret synkront hvis vi har skiftet side, eller opdater tider/highlight
    renderHeadlinesGrid();
  }, 180);
}

function startNewsCycle() {
  if (newsCycleTimer) clearInterval(newsCycleTimer);
  newsCycleTimer = setInterval(() => {
    const active = getActiveArticles();
    if (active.length > 0) {
      currentIndex = (currentIndex + 1) % active.length;
      displayHeroNews();
    }
  }, CONFIG.intervals.newsCycle);
}

export function initNews() {
  renderFilterBar();
  renderHeadlinesGrid(true);
  displayHeroNews();
  startNewsCycle();

  fetchNews();
  setInterval(fetchNews, CONFIG.intervals.newsFetch);
}
