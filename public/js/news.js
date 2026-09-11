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
    id: 'dr-ost-1',
    source: 'DR Østjylland',
    category: 'Klima & Byrum',
    feedId: 'dr-ostjylland',
    title: 'Aarhus Havn indvier nyt klimasikringsprojekt for at beskytte midtbyen mod stormflod',
    description: 'Det omfattende sluse- og pumpeanlæg er designet til at håndtere fremtidige ekstreme vandstande i bugten.',
    pubDate: new Date(Date.now() - 2700000).toISOString(),
    imageUrl: null
  },
  {
    id: 'pol-1',
    source: 'Politiken',
    category: 'Samfund',
    feedId: 'politiken',
    title: 'Ny rapport kortlægger danskernes medievaner: Digitalt forbrug når nye højder',
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
    id: 'guard-1',
    source: 'The Guardian',
    category: 'Miljø',
    feedId: 'the-guardian',
    title: 'Global renewable energy investments reach historic high as wind and solar capacity surges',
    description: 'International monitoring reveals accelerating green transition across European and international power grids.',
    pubDate: new Date(Date.now() - 5400000).toISOString(),
    imageUrl: null
  }
];

let newsItems = [...FALLBACK_NEWS];
let feedsData = {
  'dr-seneste': FALLBACK_NEWS.filter(i => i.feedId === 'dr-seneste'),
  'dr-politik': FALLBACK_NEWS.filter(i => i.feedId === 'dr-politik'),
  'dr-ostjylland': FALLBACK_NEWS.filter(i => i.feedId === 'dr-ostjylland'),
  'politiken': FALLBACK_NEWS.filter(i => i.feedId === 'politiken'),
  'bbc-world': FALLBACK_NEWS.filter(i => i.feedId === 'bbc-world'),
  'the-guardian': FALLBACK_NEWS.filter(i => i.feedId === 'the-guardian')
};

let availableSources = [
  { id: 'dr-seneste', source: 'DR Seneste' },
  { id: 'dr-politik', source: 'DR Politik' },
  { id: 'dr-ostjylland', source: 'DR Østjylland' },
  { id: 'politiken', source: 'Politiken' },
  { id: 'bbc-world', source: 'BBC World' },
  { id: 'the-guardian', source: 'The Guardian' }
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

  if (feedId !== 'all' && feedsData[feedId] && feedsData[feedId].length > 0) {
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
    return `
      <div class="stream-article-card ${isHero ? 'is-active-hero' : ''}" data-feed="${item.feedId}">
        <div class="stream-card-meta">
          <span class="news-badge badge-${item.feedId || 'general'}">${item.source}</span>
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
    if (sourceEl) {
      sourceEl.textContent = item.source;
      sourceEl.className = `news-badge badge-${item.feedId || 'general'}`;
    }
    if (catEl) {
      catEl.textContent = item.category || 'Tophistorie';
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
