// js/celestial.js - Solopgang, solnedgang, dagslys-fremskridt og månefase-beregninger
import { CONFIG } from './config.js';

// Reference nymåne: 11. januar 2024 kl. 11:57 UTC
const LUNAR_EPOCH = new Date('2024-01-11T11:57:00Z').getTime();
const SYNODIC_MONTH = 29.53058867 * 86400000; // Dage i millisekunder

let cachedSunrise = null;
let cachedSunset = null;

export function calculateMoonPhase(date = new Date()) {
  const diff = date.getTime() - LUNAR_EPOCH;
  const cycles = diff / SYNODIC_MONTH;
  const phase = cycles - Math.floor(cycles); // 0.0 til 1.0

  // Belysningsgrad i procent (0% til 100%)
  const illumination = Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);
  const moonAgeDays = (phase * 29.53058867).toFixed(1);

  let phaseName = '';
  let phaseIcon = '';

  if (phase < 0.03 || phase >= 0.97) {
    phaseName = 'Nymåne';
    phaseIcon = '🌑';
  } else if (phase < 0.22) {
    phaseName = 'Voksende månesegl';
    phaseIcon = '🌒';
  } else if (phase < 0.28) {
    phaseName = 'Første kvarter';
    phaseIcon = '🌓';
  } else if (phase < 0.47) {
    phaseName = 'Tiltagende måne';
    phaseIcon = '🌔';
  } else if (phase < 0.53) {
    phaseName = 'Fuldmåne';
    phaseIcon = '🌕';
  } else if (phase < 0.72) {
    phaseName = 'Aftagende måne';
    phaseIcon = '🌖';
  } else if (phase < 0.78) {
    phaseName = 'Sidste kvarter';
    phaseIcon = '🌗';
  } else {
    phaseName = 'Aftagende månesegl';
    phaseIcon = '🌘';
  }

  return {
    phase,
    illumination,
    moonAgeDays,
    phaseName,
    phaseIcon
  };
}

// Genererer et præcist SVG måne-ikon med realistisk skyggefase
export function renderMoonSvg(phase) {
  // phase er mellem 0 og 1
  const r = 36;
  const cx = 40;
  const cy = 40;

  // Bestem om det er voksende eller aftagende
  const isWaxing = phase < 0.5;
  // d-værdi for ellipse kurven
  const k = Math.cos(phase * 2 * Math.PI);
  const rx = Math.max(0.1, Math.abs(r * k));

  let litPath = '';
  if (phase < 0.25) {
    // Voksende segl
    litPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${rx} ${r} 0 0 1 ${cx} ${cy - r}`;
  } else if (phase < 0.5) {
    // Voksende over halv
    litPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${rx} ${r} 0 0 0 ${cx} ${cy - r}`;
  } else if (phase < 0.75) {
    // Aftagende over halv
    litPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${rx} ${r} 0 0 1 ${cx} ${cy - r}`;
  } else {
    // Aftagende segl
    litPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${rx} ${r} 0 0 0 ${cx} ${cy - r}`;
  }

  const isFullMoon = phase >= 0.48 && phase <= 0.52;
  const isNewMoon = phase < 0.03 || phase >= 0.97;

  let moonGlowContent = '';
  if (isFullMoon) {
    moonGlowContent = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#moonGlow)" filter="drop-shadow(0 0 8px rgba(245, 220, 140, 0.6))" />`;
  } else if (!isNewMoon) {
    moonGlowContent = `<path d="${litPath}" fill="url(#moonGlow)" filter="drop-shadow(0 0 6px rgba(235, 205, 130, 0.4))" />`;
  }

  return `
    <svg viewBox="0 0 80 80" class="moon-svg" width="68" height="68">
      <defs>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stop-color="#fff6db" stop-opacity="0.95" />
          <stop offset="90%" stop-color="#e8cf94" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#d4af37" stop-opacity="0.4" />
        </radialGradient>
        <radialGradient id="darkSide" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#141926" />
          <stop offset="100%" stop-color="#090d16" />
        </radialGradient>
      </defs>
      <!-- Mørk base -->
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#darkSide)" stroke="rgba(212, 175, 55, 0.3)" stroke-width="1.2" />
      <!-- Oplyst del -->
      ${moonGlowContent}
    </svg>
  `;
}

export function updateCelestialDisplay(sunriseDate, sunsetDate) {
  if (sunriseDate) cachedSunrise = sunriseDate;
  if (sunsetDate) cachedSunset = sunsetDate;

  const moonInfo = calculateMoonPhase();

  const moonIconContainer = document.getElementById('moon-graphic');
  const moonPhaseNameEl = document.getElementById('moon-phase-name');
  const moonIllumEl = document.getElementById('moon-illumination');
  const moonAgeEl = document.getElementById('moon-age');

  if (moonIconContainer) {
    moonIconContainer.innerHTML = renderMoonSvg(moonInfo.phase);
  }
  if (moonPhaseNameEl) {
    moonPhaseNameEl.textContent = moonInfo.phaseName;
  }
  if (moonIllumEl) {
    moonIllumEl.textContent = `${moonInfo.illumination}% oplyst`;
  }
  if (moonAgeEl) {
    moonAgeEl.textContent = `Dag ${moonInfo.moonAgeDays} i cyklus`;
  }

  // Solopgang & Solnedgang tider & dagslysbue
  const effectiveSunrise = sunriseDate || cachedSunrise;
  const effectiveSunset = sunsetDate || cachedSunset;

  if (effectiveSunrise && effectiveSunset) {
    const sunriseEl = document.getElementById('sunrise-time');
    const sunsetEl = document.getElementById('sunset-time');
    const daylightDurationEl = document.getElementById('daylight-duration');
    const sunStatusEl = document.getElementById('sun-status');

    const formatTime = (d) => {
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    };

    if (sunriseEl) sunriseEl.textContent = formatTime(effectiveSunrise);
    if (sunsetEl) sunsetEl.textContent = formatTime(effectiveSunset);

    const now = new Date();
    const dayLengthMs = effectiveSunset.getTime() - effectiveSunrise.getTime();
    const dayLengthHours = Math.floor(dayLengthMs / 3600000);
    const dayLengthMins = Math.floor((dayLengthMs % 3600000) / 60000);

    if (daylightDurationEl) {
      daylightDurationEl.textContent = `${dayLengthHours}t ${dayLengthMins}m dagslys`;
    }

    // Dagslys fremskridt
    let progressRatio = 0;
    let isDaytime = false;

    if (now < effectiveSunrise) {
      progressRatio = 0;
      if (sunStatusEl) {
        const msUntil = effectiveSunrise.getTime() - now.getTime();
        const hrs = Math.floor(msUntil / 3600000);
        const mins = Math.floor((msUntil % 3600000) / 60000);
        sunStatusEl.textContent = `Solopgang om ${hrs}t ${mins}m`;
      }
    } else if (now > effectiveSunset) {
      progressRatio = 1;
      if (sunStatusEl) {
        sunStatusEl.textContent = 'Solen er gået ned for i dag';
      }
    } else {
      progressRatio = Math.min(1, Math.max(0, (now.getTime() - effectiveSunrise.getTime()) / dayLengthMs));
      isDaytime = true;
      if (sunStatusEl) {
        const msLeft = effectiveSunset.getTime() - now.getTime();
        const hrs = Math.floor(msLeft / 3600000);
        const mins = Math.floor((msLeft % 3600000) / 60000);
        sunStatusEl.textContent = `${hrs}t ${mins}m dagslys tilbage`;
      }
    }

    // Opdater SVG Solbue
    const orbGroup = document.getElementById('solar-orb-group');
    const activeArcPath = document.getElementById('solar-arc-active');
    const trackPath = document.getElementById('solar-arc-track');

    if (orbGroup) {
      const t = progressRatio;
      // Bezier kurve: P0=(24,46), P1=(160, 4), P2=(296,46)
      const p0 = { x: 24, y: 46 };
      const p1 = { x: 160, y: 4 };
      const p2 = { x: 296, y: 46 };

      const curX = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
      const curY = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;

      orbGroup.setAttribute('transform', `translate(${curX.toFixed(1)}, ${curY.toFixed(1)})`);

      // Dæmp haloen hvis det er nat
      const halo = orbGroup.querySelector('.sun-orb-halo');
      if (halo) {
        halo.style.opacity = isDaytime ? '1' : '0.25';
      }
    }

    if (activeArcPath && trackPath) {
      try {
        const len = trackPath.getTotalLength() || 300;
        activeArcPath.style.strokeDasharray = `${len}`;
        activeArcPath.style.strokeDashoffset = `${len * (1 - progressRatio)}`;
      } catch (e) {
        // Fallback hvis getTotalLength ikke kan kaldes i et specifikt miljø
      }
    }
  }
}

export function initCelestial() {
  updateCelestialDisplay();
  setInterval(() => {
    updateCelestialDisplay();
  }, CONFIG.intervals.celestialRefresh || 60000);
}
