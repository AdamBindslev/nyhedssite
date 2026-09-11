// js/clock.js - Håndterer præcis tidsvisning, ugenummer og dansk dato

function getWeekNumber(date) {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target) / 604800000);
}

export function initClock() {
  const hoursEl = document.getElementById('clock-hours');
  const minutesEl = document.getElementById('clock-minutes');
  const secondsEl = document.getElementById('clock-seconds');
  const dateEl = document.getElementById('clock-date');
  const weekEl = document.getElementById('clock-week');

  function update() {
    const now = new Date();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    if (hoursEl) hoursEl.textContent = hours;
    if (minutesEl) minutesEl.textContent = minutes;
    if (secondsEl) secondsEl.textContent = seconds;

    // Dansk datoformat: f.eks. Fredag d. 11. september 2026
    const daysDanish = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
    const monthsDanish = [
      'januar', 'februar', 'marts', 'april', 'maj', 'juni',
      'juli', 'august', 'september', 'oktober', 'november', 'december'
    ];

    const dayName = daysDanish[now.getDay()];
    const dayOfMonth = now.getDate();
    const monthName = monthsDanish[now.getMonth()];
    const year = now.getFullYear();

    if (dateEl) {
      dateEl.textContent = `${dayName} d. ${dayOfMonth}. ${monthName} ${year}`;
    }

    if (weekEl) {
      const weekNumber = getWeekNumber(now);
      weekEl.textContent = `Uge ${weekNumber}`;
    }
  }

  update();
  setInterval(update, 1000);
}
