// js/weather.js - Open-Meteo integration med vejrudsigt, temperatur, soltider og prognose
import { CONFIG } from './config.js';
import { updateCelestialDisplay } from './celestial.js';

// Oversættelse af WMO vejr-koder til dansk tekst og ikon
const WEATHER_CODES = {
  0: { text: 'Klar himmel', icon: '☀️', nightIcon: '🌙' },
  1: { text: 'Hovedsageligt klart', icon: '🌤️', nightIcon: '🌤️' },
  2: { text: 'Delvist skyet', icon: '⛅', nightIcon: '☁️' },
  3: { text: 'Overskyet', icon: '☁️', nightIcon: '☁️' },
  45: { text: 'Tåge', icon: '🌫️', nightIcon: '🌫️' },
  48: { text: 'Rimtåge', icon: '🌫️', nightIcon: '🌫️' },
  51: { text: 'Let støvregn', icon: '🌦️', nightIcon: '🌦️' },
  53: { text: 'Støvregn', icon: '🌧️', nightIcon: '🌧️' },
  55: { text: 'Tæt støvregn', icon: '🌧️', nightIcon: '🌧️' },
  61: { text: 'Let regn', icon: '🌦️', nightIcon: '🌧️' },
  63: { text: 'Regn', icon: '🌧️', nightIcon: '🌧️' },
  65: { text: 'Kraftig regn', icon: '🌧️', nightIcon: '🌧️' },
  71: { text: 'Let sne', icon: '🌨️', nightIcon: '🌨️' },
  73: { text: 'Snevejr', icon: '❄️', nightIcon: '❄️' },
  75: { text: 'Kraftigt snefald', icon: '❄️', nightIcon: '❄️' },
  80: { text: 'Lette regnbyger', icon: '🌦️', nightIcon: '🌦️' },
  81: { text: 'Regnbyger', icon: '🌧️', nightIcon: '🌧️' },
  82: { text: 'Voldsomme byger', icon: '⛈️', nightIcon: '⛈️' },
  95: { text: 'Tordenvejr', icon: '⛈️', nightIcon: '⛈️' },
  96: { text: 'Torden med hagl', icon: '⛈️', nightIcon: '⛈️' },
  99: { text: 'Kraftigt tordenvejr', icon: '🌩️', nightIcon: '🌩️' }
};

export async function fetchWeather(lat = CONFIG.location.latitude, lon = CONFIG.location.longitude, locationName = CONFIG.location.name) {
  try {
    const url = `${CONFIG.endpoints.weather}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=${encodeURIComponent(CONFIG.location.timezone)}&forecast_days=1`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    renderWeather(data, locationName);
    return data;
  } catch (err) {
    console.warn('Fejl ved hentning af vejrdata:', err);
    // Skånsom fallback visning
    const tempEl = document.getElementById('weather-temp');
    if (tempEl && tempEl.textContent === '--') {
      tempEl.textContent = '12°';
      const condEl = document.getElementById('weather-condition');
      if (condEl) condEl.textContent = 'Data opdateres...';
    }
  }
}

function renderWeather(data, locationName) {
  const current = data.current;
  const daily = data.daily;
  const isDay = current.is_day === 1;

  const codeInfo = WEATHER_CODES[current.weather_code] || { text: 'Skiftende', icon: '🌤️', nightIcon: '🌙' };
  const icon = isDay ? codeInfo.icon : (codeInfo.nightIcon || codeInfo.icon);

  // Elementer
  const locationEl = document.getElementById('weather-location');
  const tempEl = document.getElementById('weather-temp');
  const conditionEl = document.getElementById('weather-condition');
  const iconEl = document.getElementById('weather-icon');
  const highLowEl = document.getElementById('weather-high-low');
  const windEl = document.getElementById('weather-wind');
  const humidityEl = document.getElementById('weather-humidity');
  const precipEl = document.getElementById('weather-precip');

  if (locationEl) locationEl.textContent = locationName;
  if (tempEl) tempEl.textContent = `${Math.round(current.temperature_2m)}°`;
  if (conditionEl) conditionEl.textContent = codeInfo.text;
  if (iconEl) iconEl.textContent = icon;

  const maxTemp = Math.round(daily.temperature_2m_max[0]);
  const minTemp = Math.round(daily.temperature_2m_min[0]);
  if (highLowEl) highLowEl.textContent = `H: ${maxTemp}°  L: ${minTemp}°`;

  if (windEl) windEl.textContent = `${Math.round(current.wind_speed_10m)} km/t`;
  if (humidityEl) humidityEl.textContent = `${Math.round(current.relative_humidity_2m)}% fugt`;

  const precipChance = daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 0;
  if (precipEl) precipEl.textContent = `${precipChance}% regn`;

  // Time-for-time mini udsigt (de næste 4 timer)
  const hourlyContainer = document.getElementById('weather-hourly-list');
  if (hourlyContainer && data.hourly) {
    const currentHour = new Date().getHours();
    let hourlyHtml = '';

    for (let i = 1; i <= 4; i++) {
      const targetIdx = currentHour + (i * 2);
      if (targetIdx < data.hourly.time.length) {
        const timeStr = data.hourly.time[targetIdx].split('T')[1]?.slice(0, 5) || `+${i * 2}t`;
        const temp = Math.round(data.hourly.temperature_2m[targetIdx]);
        const hCode = data.hourly.weather_code[targetIdx];
        const hInfo = WEATHER_CODES[hCode] || { icon: '🌤️' };

        hourlyHtml += `
          <div class="hourly-item">
            <span class="hourly-time">${timeStr}</span>
            <span class="hourly-icon">${hInfo.icon}</span>
            <span class="hourly-temp">${temp}°</span>
          </div>
        `;
      }
    }
    hourlyContainer.innerHTML = hourlyHtml;
  }

  // Solopgang & Solnedgang
  if (daily.sunrise && daily.sunset) {
    const sunriseDate = new Date(daily.sunrise[0]);
    const sunsetDate = new Date(daily.sunset[0]);
    updateCelestialDisplay(sunriseDate, sunsetDate);

    // Gem globalt til okkulte beregninger
    window.CEL_SOLAR_TIMES = { sunriseDate, sunsetDate };
    window.dispatchEvent(new CustomEvent('solar-times-updated', { detail: { sunriseDate, sunsetDate } }));
  }
}
