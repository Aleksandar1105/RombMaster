// Offline career progress. Kept separate from the unfinished game save so
// existing Continue/Undo data remains compatible with quick matches.
export const PROFILE_KEY = 'rombmaster_profile_v1';
export const CAREER_LEVEL_COUNT = 30;

export function careerLevel(level) {
  if (!Number.isInteger(level) || level < 1 || level > CAREER_LEVEL_COUNT) {
    throw new Error('Invalid career level');
  }
  return {
    level,
    size: level <= 10 ? 4 : level <= 20 ? 6 : 8,
    diff: level <= 10 ? 'easy' : level <= 20 ? 'normal' : 'hard',
  };
}

export function freshProfile(name = 'Player') {
  return {
    version: 1,
    name,
    xp: 0,
    unlockedLevel: 1,
    stars: {},
    stats: { played: 0, wins: 0, draws: 0, losses: 0 },
  };
}

export function cleanPlayerName(raw) {
  if (typeof raw !== 'string') throw new Error('Invalid player name');
  const name = raw.trim().replace(/\s+/g, ' ');
  if (!name || [...name].length > 18 || /[\u0000-\u001f\u007f]/.test(name)) {
    throw new Error('Name must contain 1 to 18 visible characters.');
  }
  return name;
}

function validCounter(value) {
  return Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000;
}

function parseProfile(raw) {
  if (typeof raw !== 'string' || raw.length > 20_000) throw new Error('Invalid profile size');
  const data = JSON.parse(raw);
  if (!data || data.version !== 1 || data.name !== cleanPlayerName(data.name) ||
      !validCounter(data.xp) || !Number.isInteger(data.unlockedLevel) ||
      data.unlockedLevel < 1 || data.unlockedLevel > CAREER_LEVEL_COUNT ||
      !data.stars || typeof data.stars !== 'object' || Array.isArray(data.stars) ||
      !data.stats || typeof data.stats !== 'object') throw new Error('Invalid profile');

  const stars = Object.create(null);
  for (const [key, value] of Object.entries(data.stars)) {
    const level = Number(key);
    if (!/^(?:[1-9]|[12][0-9]|30)$/.test(key) ||
        level > data.unlockedLevel || !Number.isInteger(value) || value < 1 || value > 3) {
      throw new Error('Invalid career stars');
    }
    stars[level] = value;
  }
  const { played, wins, draws, losses } = data.stats;
  if (![played, wins, draws, losses].every(validCounter) ||
      played !== wins + draws + losses) throw new Error('Invalid game stats');
  return {
    version: 1, name: data.name, xp: data.xp,
    unlockedLevel: data.unlockedLevel, stars,
    stats: { played, wins, draws, losses },
  };
}

function persist(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return { status: 'ready', profile };
  } catch {
    return { status: 'unavailable' };
  }
}

export const ProfileStore = {
  read() {
    let raw;
    try { raw = localStorage.getItem(PROFILE_KEY); }
    catch { return { status: 'unavailable' }; }
    if (raw === null) return { status: 'empty', profile: freshProfile() };
    try { return { status: 'ready', profile: parseProfile(raw) }; }
    catch { return { status: 'invalid' }; }
  },

  saveName(rawName) {
    let name;
    try { name = cleanPlayerName(rawName); }
    catch { return { status: 'bad-name' }; }
    const current = this.read();
    // An unrecognized profile must not be overwritten without explicit reset.
    if (current.status === 'invalid' || current.status === 'unavailable') return current;
    return persist({ ...current.profile, name });
  },

  reset(name = 'Player') {
    // Only call after the UI has explicitly confirmed replacing invalid data.
    try { return persist(freshProfile(cleanPlayerName(name))); }
    catch { return { status: 'bad-name' }; }
  },

  recordCareer(level, playerScore, computerScore) {
    let config;
    try { config = careerLevel(level); }
    catch { return { status: 'invalid-level' }; }
    if (![playerScore, computerScore].every(validCounter)) return { status: 'invalid-score' };
    const current = this.read();
    if (!['empty', 'ready'].includes(current.status)) return current;
    if (level > current.profile.unlockedLevel) return { status: 'locked' };

    const profile = current.profile;
    const stats = { ...profile.stats, played: profile.stats.played + 1 };
    const stars = { ...profile.stars };
    let earnedXP = 0;
    let awardedStars = 0;
    if (playerScore > computerScore) {
      stats.wins++;
      const margin = (playerScore - computerScore) / Math.max(1, playerScore + computerScore);
      awardedStars = margin >= 0.4 ? 3 : margin >= 0.2 ? 2 : 1;
      const oldStars = stars[level] || 0;
      if (awardedStars > oldStars) {
        earnedXP = (awardedStars - oldStars) * 50 + (oldStars === 0 ? 50 : 0);
        stars[level] = awardedStars;
      }
    } else if (playerScore === computerScore) {
      stats.draws++;
    } else {
      stats.losses++;
    }
    const updated = {
      ...profile,
      xp: profile.xp + earnedXP,
      stats,
      stars,
      unlockedLevel: playerScore > computerScore && level === profile.unlockedLevel
        ? Math.min(CAREER_LEVEL_COUNT, level + 1) : profile.unlockedLevel,
    };
    const saved = persist(updated);
    return saved.status === 'ready'
      ? { ...saved, earnedXP, awardedStars, victory: playerScore > computerScore, level: config.level }
      : saved;
  },
};
