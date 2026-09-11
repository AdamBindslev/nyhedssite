// js/history.js - Denne dag i historien & Mærkedage / Kendte fødselsdage
import { CONFIG } from './config.js';

let historyQueue = [];
let currentIndex = 0;
let cycleTimer = null;

// Kurateret nød-fallback hvis Wikipedia API er nede
const FALLBACK_HISTORY = [
  {
    type: 'event',
    typeLabel: 'Historisk Begivenhed',
    year: '1977',
    text: 'Voyager 1 rumsonden opsendes for at udforske det ydre solsystem og bærer 'The Golden Record' med hilsener fra Jorden.'
  },
  {
    type: 'birth',
    typeLabel: 'Mærkedag • Fødselsdag',
    year: '1885',
    text: 'Niels Bohr, banebrydende dansk fysiker og modtager af Nobelprisen for atommodellen og kvantemekanikken.'
  },
  {
    type: 'event',
    typeLabel: 'Historisk Begivenhed',
    year: '1969',
    text: 'Mennesket tager sine første skridt på Månen med ordene: Et lille skridt for et menneske, et kæmpemæssigt spring for menneskeheden.'
  },
  {
    type: 'birth',
    typeLabel: 'Mærkedag • Fødselsdag',
    year: '1805',
    text: 'H.C. Andersen, verdensberømt dansk forfatter og eventyrdigter.'
  }
];

export async function fetchHistoryData() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  try {
    const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/${month}/${day}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    const formattedItems = [];

    // Hent udvalgte begivenheder (sorteret efter historisk vægt)
    if (data.events && Array.isArray(data.events)) {
      const topEvents = data.events.slice(0, 10);
      for (const ev of topEvents) {
        formattedItems.push({
          type: 'event',
          typeLabel: 'Denne dag i historien',
          year: ev.year,
          text: ev.text
        });
      }
    }

    // Hent kendte født denne dag
    if (data.births && Array.isArray(data.births)) {
      const topBirths = data.births.slice(0, 10);
      for (const b of topBirths) {
        formattedItems.push({
          type: 'birth',
          typeLabel: 'Født denne dag',
          year: b.year,
          text: b.text
        });
      }
    }

    if (formattedItems.length > 0) {
      // Skiftevis flet begivenheder og fødselsdage for variation
      historyQueue = [];
      const events = formattedItems.filter(i => i.type === 'event');
      const births = formattedItems.filter(i => i.type === 'birth');
      const maxLen = Math.max(events.length, births.length);

      for (let i = 0; i < maxLen; i++) {
        if (events[i]) historyQueue.push(events[i]);
        if (births[i]) historyQueue.push(births[i]);
      }
    } else {
      historyQueue = FALLBACK_HISTORY;
    }
  } catch (err) {
    console.warn('Kunne ikke hente onthisday fra Wikipedia, bruger fallback:', err.message);
    if (historyQueue.length === 0) {
      historyQueue = FALLBACK_HISTORY;
    }
  }

  displayCurrentItem();
  startHistoryCycle();
}

function displayCurrentItem() {
  if (historyQueue.length === 0) return;

  const item = historyQueue[currentIndex];
  const container = document.getElementById('history-content');
  const badgeEl = document.getElementById('history-badge');
  const yearEl = document.getElementById('history-year');
  const textEl = document.getElementById('history-text');

  if (!container || !item) return;

  // Blød fade transition
  container.classList.add('fade-out');

  setTimeout(() => {
    if (badgeEl) {
      badgeEl.textContent = item.typeLabel;
      badgeEl.className = `history-badge ${item.type === 'birth' ? 'badge-birth' : 'badge-event'}`;
    }
    if (yearEl) yearEl.textContent = item.year;
    if (textEl) textEl.textContent = item.text;

    container.classList.remove('fade-out');
    container.classList.add('fade-in');

    setTimeout(() => {
      container.classList.remove('fade-in');
    }, 400);
  }, 300);
}

function startHistoryCycle() {
  if (cycleTimer) clearInterval(cycleTimer);
  cycleTimer = setInterval(() => {
    if (historyQueue.length > 0) {
      currentIndex = (currentIndex + 1) % historyQueue.length;
      displayCurrentItem();
    }
  }, CONFIG.intervals.historyCycle);
}

export function initHistory() {
  fetchHistoryData();
  // Genhent hver 6. time
  setInterval(fetchHistoryData, CONFIG.intervals.historyFetch);
}
