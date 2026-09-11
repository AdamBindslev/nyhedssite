// js/config.js - Central konfiguration til dashboardet
export const CONFIG = {
  // Standardplacering (Aarhus / Østjylland)
  location: {
    name: 'Aarhus',
    region: 'Østjylland',
    latitude: 56.1629,
    longitude: 10.2039,
    timezone: 'Europe/Copenhagen'
  },

  // Tidsintervaller i millisekunder
  intervals: {
    clockTick: 1000,           // Live opdatering af ur
    weatherRefresh: 1200000,    // Hent nyt vejr hver 20. minut
    celestialRefresh: 60000,    // Opdater solbue og planetariske timer hvert minut
    newsFetch: 600000,          // Hent nye RSS feeds hvert 10. minut
    newsCycle: 13000,           // Skift nyhedsoverskrift hver 13. sekund
    historyFetch: 21600000,     // Hent historiske data hver 6. time
    historyCycle: 14000         // Skift historie/mærkedag hver 14. sekund
  },

  // API Endpoints
  endpoints: {
    news: '/api/news',
    // Fallback hvis API-ruten ikke svarer lokalt uden server
    corsFallback: 'https://api.allorigins.win/get?url=',
    weather: 'https://api.open-meteo.com/v1/forecast',
    wikipediaToday: 'https://en.wikipedia.org/api/rest_v1/feed/onthisday'
  }
};
