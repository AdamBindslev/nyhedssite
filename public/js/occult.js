// js/occult.js - Universel Kosmisk Tilstand & Planetariske Timer
// Baseret på ægte hermetiske/astronomiske beregninger med poetisk mystisk præcision

// Chaldæisk planetorden (fra langsomst til hurtigst)
const CHALDEAN_ORDER = [
  { name: 'Saturn', symbol: '♄', metal: 'Bly', quality: 'Tid, struktur, grænser og dyb eftertanke' },
  { name: 'Jupiter', symbol: '♃', metal: 'Tin', quality: 'Ekspansion, visdom, lykke og generøsitet' },
  { name: 'Mars', symbol: '♂', metal: 'Jern', quality: 'Handling, viljestyrke, mod og drivkraft' },
  { name: 'Solen', symbol: '☉', metal: 'Guld', quality: 'Vitalitet, bevidsthed, lys og klarhed' },
  { name: 'Venus', symbol: '♀', metal: 'Kobber', quality: 'Harmoni, æstetik, kærlighed og samhørighed' },
  { name: 'Merkur', symbol: '☿', metal: 'Kviksølv', quality: 'Kommunikation, intellekt, rejse og formidling' },
  { name: 'Månen', symbol: '☽', metal: 'Sølv', quality: 'Intuition, drømme, følelser og underbevidsthed' }
];

// Ugedagens hersker (0: Søndag ... 6: Lørdag)
const DAY_RULERS = [3, 6, 2, 5, 1, 4, 0]; // Index i CHALDEAN_ORDER for: Søn, Man, Tir, Ons, Tor, Fre, Lør

// De 12 stjernetegn og deres elementer
const ZODIAC_SIGNS = [
  { name: 'Vædderen', symbol: '♈', element: 'Ild', quality: 'Kardinal' },
  { name: 'Tyren', symbol: '♉', element: 'Jord', quality: 'Fast' },
  { name: 'Tvillingerne', symbol: '♊', element: 'Luft', quality: 'Bevægelig' },
  { name: 'Krebsen', symbol: '♋', element: 'Vand', quality: 'Kardinal' },
  { name: 'Løven', symbol: '♌', element: 'Ild', quality: 'Fast' },
  { name: 'Jomfruen', symbol: '♍', element: 'Jord', quality: 'Bevægelig' },
  { name: 'Vægten', symbol: '♎', element: 'Luft', quality: 'Kardinal' },
  { name: 'Skorpionen', symbol: '♏', element: 'Vand', quality: 'Fast' },
  { name: 'Skytten', symbol: '♐', element: 'Ild', quality: 'Bevægelig' },
  { name: 'Stenbukken', symbol: '♑', element: 'Jord', quality: 'Kardinal' },
  { name: 'Vandmanden', symbol: '♒', element: 'Luft', quality: 'Fast' },
  { name: 'Fiskene', symbol: '♓', element: 'Vand', quality: 'Bevægelig' }
];

// Beregn Månens aktuelle stjernetegn ud fra siderisk omløb (~27.32166 dage)
function calculateMoonSign(now = new Date()) {
  // Reference dato: 1. jan 2024 kl. 00:00 UTC (Månen i Jomfruen ca. 160° ekliptisk længde)
  const refTime = new Date('2024-01-01T00:00:00Z').getTime();
  const refDegrees = 158.5; // Jomfruen (ca. 5. tegn, 150°-180°)
  const msElapsed = now.getTime() - refTime;
  const daysElapsed = msElapsed / 86400000;

  // Månens gennemsnitlige daglige bevægelse i ekliptikken er ~13.17635 grader
  const degreesTraveled = daysElapsed * 13.176358;
  const currentDegrees = (refDegrees + degreesTraveled) % 360;
  const normalizedDeg = ((currentDegrees % 360) + 360) % 360;

  const signIndex = Math.floor(normalizedDeg / 30) % 12;
  const degreeInSign = Math.floor(normalizedDeg % 30);
  const sign = ZODIAC_SIGNS[signIndex];

  // Void of course indtræffer traditionelt i de sidste 3 grader af et tegn før skift
  const isVoidOfCourse = degreeInSign >= 27;

  return {
    ...sign,
    degreeInSign,
    isVoidOfCourse
  };
}

// Beregn den aktuelle planetariske time ud fra solopgang og solnedgang
export function calculatePlanetaryHour(now = new Date(), sunrise = null, sunset = null) {
  // Standard hvis vejret endnu ikke har leveret solopgang
  if (!sunrise || !sunset) {
    const defaultSunrise = new Date(now);
    defaultSunrise.setHours(6, 30, 0, 0);
    const defaultSunset = new Date(now);
    defaultSunset.setHours(18, 30, 0, 0);
    sunrise = defaultSunrise;
    sunset = defaultSunset;
  }

  // Den astrologiske dag begynder ved daggry (solopgang).
  // Timer før solopgang hører klassisk til den foregående dags hersker.
  const dayOfWeek = now.getDay();
  const isBeforeSunrise = now < sunrise;
  const effectiveDayOfWeek = isBeforeSunrise ? (dayOfWeek + 6) % 7 : dayOfWeek;
  const rulerIndex = DAY_RULERS[effectiveDayOfWeek];

  const isDay = now >= sunrise && now < sunset;
  let hourNumber = 1;
  let planetIndex = 0;
  let timeRemainingMins = 0;

  if (isDay) {
    const dayDuration = sunset.getTime() - sunrise.getTime();
    const hourLength = dayDuration / 12;
    const elapsed = now.getTime() - sunrise.getTime();
    hourNumber = Math.min(12, Math.floor(elapsed / hourLength) + 1);
    // Planet forskydning fra dagens hersker
    planetIndex = (rulerIndex + (hourNumber - 1)) % 7;
    const nextHourTimestamp = sunrise.getTime() + (hourNumber * hourLength);
    timeRemainingMins = Math.max(0, Math.round((nextHourTimestamp - now.getTime()) / 60000));
  } else {
    // Nat-time (12 timer fra solnedgang til næste solopgang)
    const nightStart = now < sunrise ? new Date(sunset.getTime() - 86400000) : sunset;
    const nextSunrise = now < sunrise ? sunrise : new Date(sunrise.getTime() + 86400000);
    const nightDuration = nextSunrise.getTime() - nightStart.getTime();
    const hourLength = nightDuration / 12;
    const elapsed = now.getTime() - nightStart.getTime();
    hourNumber = Math.min(12, Math.floor(elapsed / hourLength) + 1);
    // Nat starter på 13. time fra dagens hersker
    planetIndex = (rulerIndex + 12 + (hourNumber - 1)) % 7;
    const nextHourTimestamp = nightStart.getTime() + (hourNumber * hourLength);
    timeRemainingMins = Math.max(0, Math.round((nextHourTimestamp - now.getTime()) / 60000));
  }

  const activePlanet = CHALDEAN_ORDER[planetIndex];
  const dayPlanet = CHALDEAN_ORDER[rulerIndex];

  return {
    isDay,
    hourNumber,
    activePlanet,
    dayPlanet,
    timeRemainingMins
  };
}

export function updateOccultDisplay() {
  const now = new Date();
  const solarTimes = window.CEL_SOLAR_TIMES || {};
  const hourData = calculatePlanetaryHour(now, solarTimes.sunriseDate, solarTimes.sunsetDate);
  const moonSign = calculateMoonSign(now);

  // DOM opdateringer
  const planetHourNameEl = document.getElementById('occult-planet-name');
  const planetHourSymbolEl = document.getElementById('occult-planet-symbol');
  const planetQualityEl = document.getElementById('occult-planet-quality');
  const planetMetaEl = document.getElementById('occult-planet-meta');

  const moonSignNameEl = document.getElementById('occult-moon-sign');
  const moonSignElementEl = document.getElementById('occult-moon-element');
  const vocStatusEl = document.getElementById('occult-voc-status');
  const elementInsightEl = document.getElementById('occult-element-insight');

  if (planetHourSymbolEl) planetHourSymbolEl.textContent = hourData.activePlanet.symbol;
  if (planetHourNameEl) {
    planetHourNameEl.textContent = `${hourData.activePlanet.name}s Time (${hourData.hourNumber}. ${hourData.isDay ? 'dagtime' : 'nattime'})`;
  }
  if (planetQualityEl) {
    planetQualityEl.textContent = hourData.activePlanet.quality;
  }
  if (planetMetaEl) {
    planetMetaEl.textContent = `Dagens hersker: ${hourData.dayPlanet.name} • ${hourData.timeRemainingMins}m tilbage i timen`;
  }

  if (moonSignNameEl) {
    moonSignNameEl.textContent = `${moonSign.symbol} Månen i ${moonSign.name}`;
  }
  if (moonSignElementEl) {
    moonSignElementEl.textContent = `${moonSign.degreeInSign}° • ${moonSign.element} (${moonSign.quality})`;
  }

  if (vocStatusEl) {
    if (moonSign.isVoidOfCourse) {
      vocStatusEl.textContent = '⏸️ Void of Course (pausefase)';
      vocStatusEl.className = 'occult-badge badge-voc-active';
    } else {
      vocStatusEl.textContent = '✨ Aktiv Kosmisk Strøm';
      vocStatusEl.className = 'occult-badge badge-voc-clear';
    }
  }

  if (elementInsightEl) {
    let insight = '';
    if (moonSign.element === 'Ild') {
      insight = 'Høj skaberkraft & spontanitet. Ideel til at sætte nye initiativer i værk.';
    } else if (moonSign.element === 'Jord') {
      insight = 'Stabil & forankret energi. Godt for fokus, konkrete resultater og tålmodighed.';
    } else if (moonSign.element === 'Luft') {
      insight = 'Mental klarhed og idéudveksling. Gunstigt for ny viden og intellektuelle gennembrud.';
    } else {
      insight = 'Dyb intuition og følelsesmæssig resonans. Godt til fordybelse og refleksion.';
    }
    elementInsightEl.textContent = insight;
  }
}

export function initOccult() {
  updateOccultDisplay();
  // Lyt til solopgangsopdateringer fra vejret
  window.addEventListener('solar-times-updated', () => {
    updateOccultDisplay();
  });
  // Kør opdatering hvert minut
  setInterval(updateOccultDisplay, 60000);
}
