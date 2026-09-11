// js/app.js - Hovedinitialisering og koordinering af Celestial Dashboard
import { CONFIG } from './config.js';
import { initClock } from './clock.js';
import { fetchWeather } from './weather.js';
import { initOccult } from './occult.js';
import { initHistory } from './history.js';
import { initNews } from './news.js';

function initDashboard() {
  // 1. Initialiser realtids-ur
  initClock();

  // 2. Bestem lokation (Browser geoplacering med Aarhus fallback)
  setupLocationAndWeather();

  // 3. Initialiser det okkulte modul
  initOccult();

  // 4. Initialiser historie og mærkedage
  initHistory();

  // 5. Initialiser nyhedsfeed-cyklus
  initNews();

  // 6. Kiosk fuldskærms-genvej (Tast 'F' eller klik på det diskrete stjerne-ikon i hjørnet)
  setupKioskControls();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}

function setupLocationAndWeather() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        fetchWeather(lat, lon, 'Min Lokation');
      },
      (err) => {
        // Fallback til Aarhus
        console.info('Bruger standard Aarhus koordinater:', err.message);
        fetchWeather(CONFIG.location.latitude, CONFIG.location.longitude, CONFIG.location.name);
      },
      { timeout: 5000 }
    );
  } else {
    fetchWeather(CONFIG.location.latitude, CONFIG.location.longitude, CONFIG.location.name);
  }

  // Opdater vejr jævnligt
  setInterval(() => {
    fetchWeather(CONFIG.location.latitude, CONFIG.location.longitude, CONFIG.location.name);
  }, CONFIG.intervals.weatherRefresh);
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
