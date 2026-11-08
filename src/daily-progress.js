import { validDateKey } from './daily-challenge.js';

export const DAILY_PROGRESS_KEY = 'rombmaster_daily_progress_v1';

function fresh(date) {
  return { version: 1, date, solved: 0, completedTotal: 0,
    lastCompleted: null, streak: 0, brainPoints: 0 };
}
const counter = n => Number.isSafeInteger(n) && n >= 0 && n <= 1000000;
const yesterday = date => {
  const d = new Date(date + 'T00:00:00.000Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

function readSaved(raw) {
  if (raw.length > 5000) throw Error('Invalid progress size');
  const p = JSON.parse(raw);
  if (!p || p.version !== 1 || !validDateKey(p.date) ||
      !Number.isInteger(p.solved) || p.solved < 0 || p.solved > 3 ||
      ![p.completedTotal, p.streak, p.brainPoints].every(counter) ||
      (p.lastCompleted !== null && !validDateKey(p.lastCompleted)) ||
      p.brainPoints !== p.completedTotal * 30 ||
      p.streak > p.completedTotal ||
      (p.solved === 3 && p.lastCompleted !== p.date)) throw Error('Invalid progress');
  return p;
}

export const DailyProgress = {
  read(date) {
    if (!validDateKey(date)) return { status: 'invalid-date' };
    let raw;
    try { raw = localStorage.getItem(DAILY_PROGRESS_KEY); }
    catch { return { status: 'unavailable' }; }
    if (raw === null) return { status: 'ready', progress: fresh(date) };
    try {
      const saved = readSaved(raw);
      if (saved.date === date) return { status: 'ready', progress: saved };
      // Never reset or overwrite a future-dated record on clock rollback.
      if (saved.date > date) return { status: 'clock-changed' };
      return { status: 'ready', progress: { ...saved, date, solved: 0 } };
    } catch { return { status: 'invalid' }; }
  },

  recordSolved(date, index) {
    const result = this.read(date);
    if (result.status !== 'ready') return result;
    const p = result.progress;
    if (!Number.isInteger(index) || index < 0 || index > 2 ||
        p.solved !== index) return { status: 'out-of-order' };
    const next = { ...p, solved: index + 1 };
    if (index === 2) {
      next.completedTotal += 1;
      next.brainPoints += 30;
      next.streak = p.lastCompleted === yesterday(date) ? p.streak + 1 : 1;
      next.lastCompleted = date;
    }
    if (![next.completedTotal, next.brainPoints, next.streak].every(counter)) {
      return { status: 'limit' };
    }
    try {
      localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(next));
      return { status: 'ready', progress: next };
    } catch { return { status: 'unavailable' }; }
  },
};
