// js/history.js - Dybdegående historiske begivenheder & prominente mærkedage på tværs af århundreder
import { CONFIG } from './config.js';

let historyQueue = [];
let currentIndex = 0;
let cycleTimer = null;

export function getEpochLabel(year) {
  const y = parseInt(year, 10);
  if (isNaN(y)) return 'Historisk';
  if (y < 500) return 'Oldtiden';
  if (y < 1500) return 'Middelalder';
  if (y < 1700) return 'Renæssance';
  if (y < 1800) return 'Oplysningstid';
  if (y < 1900) return '1800-tallet';
  if (y < 1980) return '20. Århundrede';
  return 'Nyere Tid';
}

// Kurateret nød-fallback der spænder bredt over århundrederne
const FALLBACK_HISTORY = [
  {
    type: 'event',
    typeLabel: 'Historisk Begivenhed',
    year: '1297',
    epoch: 'Middelalder',
    text: 'Slaget ved Stirling Bridge: Skotterne anført af William Wallace og Andrew Moray besejrer den engelske hær.'
  },
  {
    type: 'birth',
    typeLabel: 'Mærkedag • Fødselsdag',
    year: '1533',
    epoch: 'Renæssance',
    text: 'Dronning Elizabeth 1. af England fødes; hun indleder den elisabethanske guldalder med blomstrende kunst og videnskab.'
  },
  {
    type: 'event',
    typeLabel: 'Historisk Begivenhed',
    year: '1789',
    epoch: 'Oplysningstid',
    text: 'Alexander Hamilton udnævnes til USA\'s første finansminister og grundlægger landets moderne finansielle system.'
  },
  {
    type: 'birth',
    typeLabel: 'Mærkedag • Fødselsdag',
    year: '1805',
    epoch: '1800-tallet',
    text: 'H.C. Andersen, verdenskendt dansk forfatter, poet og eventyrdigter, fødes i Odense.'
  },
  {
    type: 'birth',
    typeLabel: 'Mærkedag • Fødselsdag',
    year: '1885',
    epoch: '1800-tallet',
    text: 'Niels Bohr, banebrydende dansk atomfysiker og nobelprismodtager, grundlægger af moderne kvantemekanik.'
  },
  {
    type: 'event',
    typeLabel: 'Historisk Begivenhed',
    year: '1969',
    epoch: '20. Århundrede',
    text: 'Apollo 11 missionen: Mennesket tager sine første skridt på Månen med ordene om et gigantisk spring for menneskeheden.'
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

    const historicalEvents = [];
    const historicalBirths = [];

    // 1. Inddrag Wikipedias højt kuraterede "selected" milepæle (skelsættende verdenshistorie)
    if (data.selected && Array.isArray(data.selected)) {
      const trueHistoricalSelected = data.selected.filter(e => e.year <= 2000);
      for (const ev of trueHistoricalSelected) {
        historicalEvents.push({
          type: 'event',
          typeLabel: 'Historisk Milepæl',
          year: String(ev.year),
          epoch: getEpochLabel(ev.year),
          text: ev.text
        });
      }
    }

    // 2. Sample data.events på tværs af epoker for ægte historisk spændvidde
    if (data.events && Array.isArray(data.events)) {
      const allEvents = data.events.filter(e => e.year <= 1990);
      
      const ancientAndMedieval = allEvents.filter(e => e.year < 1500);
      const earlyModern = allEvents.filter(e => e.year >= 1500 && e.year < 1800);
      const nineteenthCentury = allEvents.filter(e => e.year >= 1800 && e.year < 1900);
      const twentiethCentury = allEvents.filter(e => e.year >= 1900 && e.year <= 1985);

      const sampled = [
        ...ancientAndMedieval.slice(0, 3),
        ...earlyModern.slice(0, 3),
        ...nineteenthCentury.slice(0, 3),
        ...twentiethCentury.slice(0, 3)
      ];

      for (const ev of sampled) {
        if (!historicalEvents.some(e => e.text === ev.text)) {
          historicalEvents.push({
            type: 'event',
            typeLabel: 'Denne dag i historien',
            year: String(ev.year),
            epoch: getEpochLabel(ev.year),
            text: ev.text
          });
        }
      }
    }

    // 3. Hent fødsler for ægte historiske personligheder (født før 1940)
    if (data.births && Array.isArray(data.births)) {
      const pre1940Births = data.births.filter(b => b.year <= 1940);
      
      const renaissanceBirths = pre1940Births.filter(b => b.year < 1700);
      const enlightenmentBirths = pre1940Births.filter(b => b.year >= 1700 && b.year < 1850);
      const modernEraBirths = pre1940Births.filter(b => b.year >= 1850 && b.year <= 1935);

      const sampledBirths = [
        ...renaissanceBirths.slice(0, 3),
        ...enlightenmentBirths.slice(0, 3),
        ...modernEraBirths.slice(0, 4)
      ];

      for (const b of sampledBirths) {
        historicalBirths.push({
          type: 'birth',
          typeLabel: 'Født denne dag',
          year: String(b.year),
          epoch: getEpochLabel(b.year),
          text: b.text
        });
      }
    }

    if (historicalEvents.length > 0 || historicalBirths.length > 0) {
      historyQueue = [];
      const maxLen = Math.max(historicalEvents.length, historicalBirths.length);

      for (let i = 0; i < maxLen; i++) {
        if (historicalEvents[i]) historyQueue.push(historicalEvents[i]);
        if (historicalBirths[i]) historyQueue.push(historicalBirths[i]);
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
  const epochEl = document.getElementById('history-epoch');
  const textEl = document.getElementById('history-text');

  if (!container || !item) return;

  container.classList.add('fade-out');

  setTimeout(() => {
    if (badgeEl) {
      badgeEl.textContent = item.typeLabel;
      badgeEl.className = `history-badge ${item.type === 'birth' ? 'badge-birth' : 'badge-event'}`;
    }
    if (yearEl) yearEl.textContent = item.year;
    if (epochEl) epochEl.textContent = item.epoch || getEpochLabel(item.year);
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
