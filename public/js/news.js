// js/news.js - Håndterer DR Politik, DR Østjylland og BBC World RSS-feeds med auto-rotation
import { CONFIG } from './config.js';

let newsItems = [];
let currentIndex = 0;
let newsCycleTimer = null;

// Fallback nyheder hvis der er et midlertidigt netværkssvigt
const FALLBACK_NEWS = [
  {
    id: 'dr-1',
    source: 'DR Politik',
    category: 'Politik',
    title: 'Finanslovsforhandlinger fortsætter på Christiansborg med fokus på velfærd og grøn omstilling',
    description: 'Partierne mødes i Finansministeriet for at drøfte prioriteringerne for det kommende budgetår.',
    pubDate: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'dr-2',
    source: 'DR Østjylland',
    category: 'Regionalt',
    title: 'Aarhus Havn indvier nyt klimasikringsprojekt for at beskytte midtbyen mod stormflod',
    description: 'Det omfattende sluse- og pumpeanlæg er designet til at håndtere fremtidige ekstreme vandstande i bugten.',
    pubDate: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'bbc-1',
    source: 'BBC World',
    category: 'Global',
    title: 'Astronomers detect unprecedented cosmic phenomenon in distant galaxy cluster',
    description: 'New telescope observations reveal extraordinary gravitational wave patterns challenging standard stellar models.',
    pubDate: new Date(Date.now() - 5400000).toISOString()
  }
];

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Lige nu';
  if (diffMins < 60) return `${diffMins} min siden`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} time${diffHours > 1 ? 'r' : ''} siden`;
  return `${Math.floor(diffHours / 24)} d. siden`;
}

export async function fetchNews() {
  try {
    const response = await fetch(CONFIG.endpoints.news);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      newsItems = data.items;
    } else {
      newsItems = FALLBACK_NEWS;
    }
  } catch (err) {
    console.warn('Kunne ikke hente nyheder fra API, forsøger fallback:', err.message);
    if (newsItems.length === 0) {
      newsItems = FALLBACK_NEWS;
    }
  }

  displayCurrentNews();
  renderUpcomingList();
  startNewsCycle();
}

function displayCurrentNews() {
  if (newsItems.length === 0) return;

  const item = newsItems[currentIndex];
  const container = document.getElementById('news-spotlight');
  const sourceEl = document.getElementById('news-source-tag');
  const timeEl = document.getElementById('news-time');
  const titleEl = document.getElementById('news-title');
  const descEl = document.getElementById('news-desc');
  const progressEl = document.getElementById('news-ticker-bar');

  if (!container || !item) return;

  // Nulstil progress bar animation
  if (progressEl) {
    progressEl.style.transition = 'none';
    progressEl.style.width = '0%';
    setTimeout(() => {
      progressEl.style.transition = `width ${CONFIG.intervals.newsCycle}ms linear`;
      progressEl.style.width = '100%';
    }, 50);
  }

  // Blød fade-out og fade-in overgang
  container.classList.add('news-fade-out');

  setTimeout(() => {
    if (sourceEl) {
      sourceEl.textContent = item.source;
      sourceEl.className = `news-badge badge-${item.feedId || 'general'}`;
    }
    if (timeEl) {
      timeEl.textContent = formatTimeAgo(item.pubDate);
    }
    if (titleEl) {
      titleEl.textContent = item.title;
    }
    if (descEl) {
      descEl.textContent = item.description || '';
      descEl.style.display = item.description ? 'block' : 'none';
    }

    container.classList.remove('news-fade-out');
    container.classList.add('news-fade-in');

    setTimeout(() => {
      container.classList.remove('news-fade-in');
    }, 350);

    renderUpcomingList();
  }, 250);
}

function renderUpcomingList() {
  const upcomingContainer = document.getElementById('news-upcoming-list');
  if (!upcomingContainer || newsItems.length === 0) return;

  // Vis de næste 3 nyheder i køen
  let html = '';
  for (let i = 1; i <= 3; i++) {
    const nextIdx = (currentIndex + i) % newsItems.length;
    const nextItem = newsItems[nextIdx];
    if (nextItem) {
      html += `
        <div class="upcoming-item">
          <span class="upcoming-source">${nextItem.source}</span>
          <span class="upcoming-title">${nextItem.title}</span>
        </div>
      `;
    }
  }
  upcomingContainer.innerHTML = html;
}

function startNewsCycle() {
  if (newsCycleTimer) clearInterval(newsCycleTimer);
  newsCycleTimer = setInterval(() => {
    if (newsItems.length > 0) {
      currentIndex = (currentIndex + 1) % newsItems.length;
      displayCurrentNews();
    }
  }, CONFIG.intervals.newsCycle);
}

export function initNews() {
  fetchNews();
  // Genhent friske feeds hvert 10. minut
  setInterval(fetchNews, CONFIG.intervals.newsFetch);
}
