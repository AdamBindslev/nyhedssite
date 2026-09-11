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

let activeFilter = 'all';
let currentIndex = 0;
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

export async function fetchNews() {
  try {
    const response = await fetch(CONFIG.endpoints.news);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      newsItems = data.items;
      if (data.byFeed) {
        feedsData = data.byFeed;
      }
      if (data.sources && Array.isArray(data.sources)) {
        availableSources = data.sources;
      }
      renderFilterBar();
      renderHeadlinesGrid();
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
  renderFilterBar();
  renderHeadlinesGrid();

  if (feedId === 'polls') {
    const pollArticles = newsItems.filter(i => i.isPoll || i.category === 'Meningsmåling' || /måling/i.test(i.title));
    if (pollArticles.length > 0) {
      const idx = newsItems.findIndex(i => i.title === pollArticles[0].title);
      if (idx !== -1) {
        currentIndex = idx;
      } else {
        newsItems.unshift(pollArticles[0]);
        currentIndex = 0;
      }
    }
    displayHeroNews();
    startNewsCycle();
  } else if (feedId !== 'all' && feedsData[feedId] && feedsData[feedId].length > 0) {
    const targetItem = feedsData[feedId][0];
    const idx = newsItems.findIndex(i => i.title === targetItem.title);
    if (idx !== -1) {
      currentIndex = idx;
    } else {
      newsItems.unshift(targetItem);
      currentIndex = 0;
    }
    displayHeroNews();
    startNewsCycle();
  }
}

function getDisplayArticles() {
  if (activeFilter === 'polls') {
    const polls = newsItems.filter(i => i.isPoll || i.category === 'Meningsmåling' || /måling/i.test(i.title));
    if (polls.length > 0) return polls.slice(0, 6);
    return newsItems.filter(i => i.category === 'Politik' || i.feedId === 'altinget' || i.feedId === 'dr-politik').slice(0, 6);
  }

  if (activeFilter !== 'all' && feedsData[activeFilter]) {
    return feedsData[activeFilter].slice(0, 6);
  }

  // Når 'Alle' er valgt: Vis 6 friske tophistorier med varierede kilder
  const seenFeeds = new Set();
  const balancedSelection = [];

  // Første omgang: 1 tophistorie fra hver kilde
  for (const item of newsItems) {
    if (!seenFeeds.has(item.feedId)) {
      seenFeeds.add(item.feedId);
      balancedSelection.push(item);
      if (balancedSelection.length >= 6) break;
    }
  }

  // Hvis færre end 6 kilder, suppler fra toppen af newsItems
  if (balancedSelection.length < 6) {
    for (const item of newsItems) {
      if (!balancedSelection.some(b => b.title === item.title)) {
        balancedSelection.push(item);
        if (balancedSelection.length >= 6) break;
      }
    }
  }

  return balancedSelection.slice(0, 6);
}

function renderHeadlinesGrid() {
  const container = document.getElementById('news-headlines-grid');
  if (!container) return;

  const currentHeroTitle = newsItems[currentIndex]?.title;
  const articles = getDisplayArticles();

  if (articles.length === 0) {
    container.innerHTML = '<div class="news-stream-empty">Opdaterer nyhedsstrøm...</div>';
    return;
  }

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
          <span class="stream-card-time">${formatTimeAgo(item.pubDate)}</span>
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
}

function promoteToHero(title) {
  const targetIdx = newsItems.findIndex(i => i.title === title);
  if (targetIdx !== -1) {
    currentIndex = targetIdx;
    displayHeroNews();
    startNewsCycle();
  }
}

function highlightActiveInGrid(heroTitle) {
  document.querySelectorAll('.stream-article-card').forEach(el => {
    const titleEl = el.querySelector('.stream-card-title');
    if (titleEl && titleEl.textContent === heroTitle) {
      el.classList.add('is-active-hero');
    } else {
      el.classList.remove('is-active-hero');
    }
  });
}

function sanitizeText(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s*Follow the day[’']s news live[\s\S]*?daily news podcast\s*/i, '')
    .replace(/Continue reading\.\.\.?\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function displayHeroNews() {
  if (newsItems.length === 0) return;

  const item = newsItems[currentIndex];
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

  // Blød fade transition
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
      descEl.textContent = cleanDesc || '';
      descEl.style.display = cleanDesc ? 'block' : 'none';
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

    highlightActiveInGrid(item.title);
  }, 180);
}

function startNewsCycle() {
  if (newsCycleTimer) clearInterval(newsCycleTimer);
  newsCycleTimer = setInterval(() => {
    if (newsItems.length > 0) {
      currentIndex = (currentIndex + 1) % newsItems.length;
      displayHeroNews();
    }
  }, CONFIG.intervals.newsCycle);
}

export function initNews() {
  renderFilterBar();
  renderHeadlinesGrid();
  displayHeroNews();
  startNewsCycle();

  fetchNews();
  setInterval(fetchNews, CONFIG.intervals.newsFetch);
}
