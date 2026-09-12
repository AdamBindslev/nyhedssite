// js/app.js - Hovedinitialisering og koordinering af Celestial Dashboard
import { CONFIG } from './config.js';
import { initClock } from './clock.js';
import { fetchWeather } from './weather.js';
import { initCelestial } from './celestial.js';
import { initOccult } from './occult.js';
import { initHistory } from './history.js';
import { initNews } from './news.js';

function initDashboard() {
  // 1. Initialiser realtids-ur
  initClock();

  // 2. Initialiser celestiale beregninger (månefase & solbue)
  initCelestial();

  // 3. Bestem lokation (Browser geoplacering med Aarhus fallback)
  setupLocationAndWeather();

  // 4. Initialiser det okkulte modul
  initOccult();

  // 5. Initialiser historie og mærkedage
  initHistory();

  // 6. Initialiser nyhedsfeed-cyklus
  initNews();

  // 7. Kiosk fuldskærms-genvej (Tast 'F' eller klik på det diskrete stjerne-ikon i hjørnet)
  setupKioskControls();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}

let activeLat = CONFIG.location.latitude;
let activeLon = CONFIG.location.longitude;
let activeLocationName = CONFIG.location.name;

function setupLocationAndWeather() {
  const updateWeather = () => fetchWeather(activeLat, activeLon, activeLocationName);

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        activeLat = pos.coords.latitude;
        activeLon = pos.coords.longitude;
        activeLocationName = 'Min Lokation';
        updateWeather();
      },
      (err) => {
        // Fallback til Aarhus
        console.info('Bruger standard Aarhus koordinater:', err.message);
        updateWeather();
      },
      { timeout: 5000 }
    );
  } else {
    updateWeather();
  }

  // Opdater vejr jævnligt med den aktive lokation
  setInterval(updateWeather, CONFIG.intervals.weatherRefresh);
}

function setupKioskControls() {
  const fullscreenBtn = document.getElementById('btn-fullscreen');
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', toggleFullscreen);
  }

  // Tryk 'f' på tastaturet for at skifte fuldskærm
  window.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
    }
  });

  // Forhindr utilsigtet scrolling (sikrer 100% kiosk-kompatibilitet)
  window.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
  window.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
}
