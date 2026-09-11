// js/news.js - Redaktionel 3-kolonners forside og auto-roterende tophistorie
import { CONFIG } from './config.js';

// Kuraterede standardnyheder så sitet aldrig står tomt eller med "Henter..."
const FALLBACK_NEWS = [
  {
    id: 'dr-1',
    source: 'DR Politik',
    category: 'Christiansborg',
    feedId: 'dr-politik',
    title: 'Finanslovsforhandlinger fortsætter på Christiansborg med fokus på velfærd og grøn omstilling',
    description: 'Partierne mødes i Finansministeriet for at drøfte prioriteringerne for det kommende budgetår, hvor sundhed og uddannelse ventes at få markante løft.',
    pubDate: new Date(Date.now() - 1800000).toISOString(),
    imageUrl: null
  },
  {
    id: 'dr-2',
    source: 'DR Østjylland',
    category: 'Klima & Byrum',
    feedId: 'dr-ostjylland',
    title: 'Aarhus Havn indvier nyt klimasikringsprojekt for at beskytte midtbyen mod stormflod',
    description: 'Det omfattende sluse- og pumpeanlæg er designet til at håndtere fremtidige ekstreme vandstande i bugten og sikre boligerne langs åen.',
    pubDate: new Date(Date.now() - 3600000).toISOString(),
    imageUrl: null
  },
  {
    id: 'bbc-1',
    source: 'BBC World',
    category: 'Global',
    feedId: 'bbc-world',
    title: 'Astronomers detect unprecedented cosmic phenomenon in distant galaxy cluster',
    description: 'New telescope observations reveal extraordinary gravitational wave patterns challenging standard stellar models and our understanding of dark matter.',
    pubDate: new Date(Date.now() - 5400000).toISOString(),
    imageUrl: null
  },
  {
    id: 'dr-3',
    source: 'DR Politik',
    category: 'Uddannelse',
    feedId: 'dr-politik',
    title: 'Nye krav til folkeskolen skal styrke praksisfag og mindske mistrivsel blandt unge',
    description: 'Regeringen og forligsparterne præsenterer en bred aftale med fokus på mere varieret skoledag.',
    pubDate: new Date(Date.now() - 7200000).toISOString(),
    imageUrl: null
  },
  {
    id: 'dr-4',
    source: 'DR Østjylland',
    category: 'Infrastruktur',
    feedId: 'dr-ostjylland',
    title: 'Letbanen i Aarhus udvider køreplanen og melder om rekordhøje passagertal',
    description: 'Flere afgange i myldretiden skal lette presset på de mest trafikerede strækninger mod universitetet.',
    pubDate: new Date(Date.now() - 9000000).toISOString(),
    imageUrl: null
  },
  {
    id: 'bbc-2',
    source: 'BBC World',
    category: 'Udland',
    feedId: 'bbc-world',
    title: 'Global renewable energy investments reach historic high as solar costs plummet',
    description: 'International energy monitors report record solar and wind adoption across European and Asian grids.',
    pubDate: new Date(Date.now() - 10800000).toISOString(),
    imageUrl: null
  }
];

let newsItems = [...FALLBACK_NEWS];
let feedsData = {
  'dr-politik': FALLBACK_NEWS.filter(i => i.feedId === 'dr-politik'),
  'dr-ostjylland': FALLBACK_NEWS.filter(i => i.feedId === 'dr-ostjylland'),
  'bbc-world': FALLBACK_NEWS.filter(i => i.feedId === 'bbc-world')
};
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
      if (data.byFeed && (data.byFeed['dr-politik']?.length || data.byFeed['bbc-world']?.length)) {
        feedsData = data.byFeed;
      } else {
        feedsData = {
          'dr-politik': data.items.filter(i => i.feedId === 'dr-politik'),
          'dr-ostjylland': data.items.filter(i => i.feedId === 'dr-ostjylland'),
          'bbc-world': data.items.filter(i => i.feedId === 'bbc-world')
        };
      }
      displayHeroNews();
      renderFeedColumns();
    }
  } catch (err) {
    console.warn('Kunne ikke hente live RSS feeds, benytter aktuelle nyheder:', err.message);
  }
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

    if (titleEl) titleEl.textContent = item.title;
    if (descEl) {
      descEl.textContent = item.description || '';
      descEl.style.display = item.description ? 'block' : 'none';
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

    highlightActiveInColumns(item.title);
  }, 180);
}

function renderFeedColumns() {
  renderSingleColumn('col-dr-politik-list', feedsData['dr-politik'] || []);
  renderSingleColumn('col-dr-ostjylland-list', feedsData['dr-ostjylland'] || []);
  renderSingleColumn('col-bbc-world-list', feedsData['bbc-world'] || []);
}

function renderSingleColumn(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const currentHeroTitle = newsItems[currentIndex]?.title;
  const displayItems = items.slice(0, 3);

  if (displayItems.length === 0) {
    container.innerHTML = '<div class="col-empty">Opdaterer feeds...</div>';
    return;
  }

  container.innerHTML = displayItems.map(item => {
    const isHero = item.title === currentHeroTitle;
    return `
      <div class="col-article-item ${isHero ? 'is-active-hero' : ''}">
        <div class="col-item-header">
          <span class="col-item-dot"></span>
          <span class="col-item-time">${formatTimeAgo(item.pubDate)}</span>
        </div>
        <div class="col-item-title" title="${item.title}">${item.title}</div>
      </div>
    `;
  }).join('');
}

function highlightActiveInColumns(heroTitle) {
  document.querySelectorAll('.col-article-item').forEach(el => {
    const titleEl = el.querySelector('.col-item-title');
    if (titleEl && titleEl.textContent === heroTitle) {
      el.classList.add('is-active-hero');
    } else {
      el.classList.remove('is-active-hero');
    }
  });
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
  // 1. Vis straks nyheder fra starten så intet står tomt
  displayHeroNews();
  renderFeedColumns();
  startNewsCycle();

  // 2. Hent live feeds fra backend
  fetchNews();
  setInterval(fetchNews, CONFIG.intervals.newsFetch);
}
