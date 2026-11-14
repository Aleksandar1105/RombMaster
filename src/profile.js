// Offline career progress. Kept separate from the unfinished game save so
// existing Continue/Undo data remains compatible with quick matches.
export const PROFILE_KEY = 'rombmaster_profile_v1';
export const CAREER_LEVEL_COUNT = 30;

// Preset avatars need no photo uploads, personal information or accounts.
export const PLAYER_AVATARS = Object.freeze([
  { id: 'spark', icon: '✨', label: 'Spark' },
  { id: 'neon-fox', icon: '🦊', label: 'Neon Fox' },
  { id: 'fox', icon: '🦊', label: 'Fox' },
  { id: 'robot', icon: '🤖', label: 'Robot' },
  { id: 'rocket', icon: '🚀', label: 'Rocket' },
  { id: 'dragon', icon: '🐉', label: 'Dragon' },
  { id: 'shield', icon: '🛡️', label: 'Shield' },
]);

// Achievements are derived from validated Career stats; never trust claims
// submitted by a client for future ranked/online leaderboards.
export const ACHIEVEMENTS = Object.freeze([
  { id: 'first-win', title: 'First Victory', description: 'Win 1 Career match' },
  { id: 'five-wins', title: 'On a Roll', description: 'Win 5 Career matches' },
  { id: 'streak-three', title: 'Hat Trick', description: 'Win 3 Career matches consecutively' },
  { id: 'ten-stars', title: 'Star Collector', description: 'Earn 10 Career stars' },
  { id: 'strategist', title: 'Strategist', description: 'Unlock Career level 11' },
  { id: 'master', title: 'Master', description: 'Unlock Career level 21' },
  { id: 'champion', title: 'Champion', description: 'Clear Career level 30' },
]);

export function careerSummary(profile) {
  const totalStars = Object.values(profile.stars || {})
    .reduce((sum, value) => sum + value, 0);
  const clearedLevels = Object.keys(profile.stars || {}).length;
  const { played, wins, draws, losses, bestStreak = 0, streak = 0 } = profile.stats;
  const winRate = played ? Math.round(100 * wins / played) : 0;
  const unlocked = {
    'first-win': wins >= 1,
    'five-wins': wins >= 5,
    'streak-three': bestStreak >= 3,
    'ten-stars': totalStars >= 10,
    strategist: profile.unlockedLevel >= 11,
    master: profile.unlockedLevel >= 21,
    champion: (profile.stars[30] || 0) >= 1,
  };
  const achievements = ACHIEVEMENTS.map(({ id, title, description }) => ({
    id, title, description, earned: Boolean(unlocked[id]),
  }));
  return {
    played, wins, draws, losses, winRate, totalStars, clearedLevels,
    bestStreak, streak, achievements,
    earnedAchievements: achievements.filter(item => item.earned).length,
  };
}

export function threeStarTarget(totalCells) {
  return Math.ceil(totalCells * 7 / 10);
}

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
    avatar: 'spark',
    xp: 0,
    unlockedLevel: 1,
    stars: {},
    stats: { played: 0, wins: 0, draws: 0, losses: 0, streak: 0, bestStreak: 0 },
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
  // v1 profiles written before step 12 have no avatar/streak fields. Give
  // them safe defaults without resetting wins, XP, unlocked stages or stars.
  const avatar = data.avatar === undefined ? 'spark' : data.avatar;
  const streak = data.stats.streak === undefined ? 0 : data.stats.streak;
  const bestStreak = data.stats.bestStreak === undefined ? 0 : data.stats.bestStreak;
  if (![played, wins, draws, losses, streak, bestStreak].every(validCounter) ||
      played !== wins + draws + losses ||
      streak > bestStreak || bestStreak > wins ||
      !PLAYER_AVATARS.some(item => item.id === avatar)) {
    throw new Error('Invalid game stats or avatar');
  }
  return {
    version: 1, name: data.name, avatar, xp: data.xp,
    unlockedLevel: data.unlockedLevel, stars,
    neonFoxUnlocked: data.neonFoxUnlocked === true || Boolean(stars[5]) || avatar === 'neon-fox',
    stats: { played, wins, draws, losses, streak, bestStreak },
  };
}

// Guest-first local save slots. The original keys remain untouched for 'guest';
// additional players use their own namespaced Career, match and Daily keys.
export const PLAYER_SLOTS_KEY = 'rombmaster_player_slots_v1';
export const MAX_LOCAL_PLAYERS = 4;
const DEFAULT_SLOTS = () => ({
  version: 1, activeId: 'guest', nextId: 1, slots: ['guest'],
});
const SLOT_ID = /^slot-([1-9][0-9]{0,3})$/;
const SCOPED_KEYS = [PROFILE_KEY, 'rhombus_save', 'rombmaster_daily_progress_v1', 'rombmaster_skin_v1'];
const scopedKey = (base, id) => id === 'guest' ? base : `${base}:${id}`;

function parseSlotIndex(raw) {
  if (typeof raw !== 'string' || raw.length > 2000) throw Error('Invalid slot index size');
  const record = JSON.parse(raw);
  if (!record || record.version !== 1 ||
      !Array.isArray(record.slots) || record.slots.length < 1 ||
      record.slots.length > MAX_LOCAL_PLAYERS || record.slots[0] !== 'guest' ||
      !Number.isInteger(record.nextId) || record.nextId < 1 || record.nextId > 10000 ||
      !record.slots.includes(record.activeId)) throw Error('Invalid slot index');
  let greatest = 0;
  const unique = new Set();
  for (const id of record.slots) {
    if (typeof id !== 'string' || unique.has(id)) throw Error('Duplicate slot');
    unique.add(id);
    if (id === 'guest') continue;
    const match = SLOT_ID.exec(id);
    if (!match) throw Error('Invalid slot ID');
    greatest = Math.max(greatest, Number(match[1]));
  }
  if (record.nextId <= greatest) throw Error('Invalid next slot ID');
  return { version: 1, activeId: record.activeId, nextId: record.nextId, slots: record.slots };
}

export const LocalSlots = {
  read() {
    try {
      const raw = localStorage.getItem(PLAYER_SLOTS_KEY);
      return { status: 'ready', index: raw === null ? DEFAULT_SLOTS() : parseSlotIndex(raw) };
    } catch (error) {
      // Missing permissions and corrupted data both block writes, not silently reset.
      const status = error instanceof SyntaxError || error?.message?.startsWith('Invalid') ||
        error?.message === 'Duplicate slot' ? 'invalid' : 'unavailable';
      return { status };
    }
  },

  storageKey(base, id = null) {
    if (!SCOPED_KEYS.includes(base)) return null;
    const result = this.read();
    if (result.status !== 'ready') return null;
    const chosen = id ?? result.index.activeId;
    return result.index.slots.includes(chosen) ? scopedKey(base, chosen) : null;
  },

  createPlayer(rawName) {
    let name;
    try { name = cleanPlayerName(rawName); }
    catch { return { status: 'bad-name' }; }
    const result = this.read();
    if (result.status !== 'ready') return result;
    const index = result.index;
    if (index.slots.length >= MAX_LOCAL_PLAYERS) return { status: 'limit' };

    // Reject duplicate labels; do not mistake changing an avatar for a new slot.
    for (const id of index.slots) {
      const existing = ProfileStore.readSlot(id);
      if (['invalid', 'unavailable'].includes(existing.status)) return existing;
      if (existing.profile.name.toLocaleLowerCase() === name.toLocaleLowerCase()) {
        return { status: 'duplicate-name' };
      }
    }

    try {
      // Never reuse an orphaned key left by an interrupted earlier creation.
      let nextId = index.nextId;
      let id;
      for (; nextId < 10000; nextId++) {
        id = `slot-${nextId}`;
        if (SCOPED_KEYS.every(base => localStorage.getItem(scopedKey(base, id)) === null)) break;
      }
      if (nextId >= 10000) return { status: 'limit' };
      localStorage.setItem(scopedKey(PROFILE_KEY, id), JSON.stringify(freshProfile(name)));
      localStorage.setItem(PLAYER_SLOTS_KEY, JSON.stringify({
        ...index, slots: [...index.slots, id], nextId: nextId + 1, activeId: id,
      }));
      return { status: 'ready', activeId: id };
    } catch {
      // An orphan may remain, but no existing profile or game is overwritten.
      return { status: 'unavailable' };
    }
  },

  switchTo(id) {
    const result = this.read();
    if (result.status !== 'ready') return result;
    const index = result.index;
    if (typeof id !== 'string' || !index.slots.includes(id)) return { status: 'not-found' };
    const profile = ProfileStore.readSlot(id);
    if (profile.status === 'invalid' || profile.status === 'unavailable') return profile;
    if (id === index.activeId) return { status: 'ready', activeId: id };
    try {
      localStorage.setItem(PLAYER_SLOTS_KEY, JSON.stringify({ ...index, activeId: id }));
      return { status: 'ready', activeId: id };
    } catch { return { status: 'unavailable' }; }
  },
};

function persist(profile) {
  try {
    const key = LocalSlots.storageKey(PROFILE_KEY);
    if (!key) return { status: 'unavailable' };
    localStorage.setItem(key, JSON.stringify(profile));
    return { status: 'ready', profile };
  } catch {
    return { status: 'unavailable' };
  }
}

export const ProfileStore = {
  read() {
    return this.readSlot();
  },

  readSlot(id = null) {
    const slots = LocalSlots.read();
    if (slots.status !== 'ready') return slots;
    const key = LocalSlots.storageKey(PROFILE_KEY, id);
    if (!key) return { status: 'not-found' };
    let raw;
    try { raw = localStorage.getItem(key); }
    catch { return { status: 'unavailable' }; }
    if (raw === null) {
      // A registered non-guest slot must not silently become a new profile.
      return key === PROFILE_KEY
        ? { status: 'empty', profile: freshProfile() } : { status: 'invalid' };
    }
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

  saveAvatar(avatarId) {
    if (typeof avatarId !== 'string' ||
        !PLAYER_AVATARS.some(item => item.id === avatarId)) {
      return { status: 'bad-avatar' };
    }
    const current = this.read();
    if (current.status === 'invalid' || current.status === 'unavailable') return current;
    if (avatarId === 'neon-fox' && !current.profile.neonFoxUnlocked) {
      return { status: 'locked' };
    }
    return persist({ ...current.profile, avatar: avatarId });
  },

  resetCareer() {
    // Intentionally preserve the local nickname and cosmetic avatar.
    // Never silently replace corrupt or unsupported profile data.
    const current = this.read();
    if (current.status === 'invalid' || current.status === 'unavailable') return current;
    const next = freshProfile(current.profile.name);
    next.avatar = current.profile.avatar;
    next.neonFoxUnlocked = Boolean(current.profile.neonFoxUnlocked);
    return persist(next);
  },

  reset(name = 'Player') {
    // Only call after the UI has explicitly confirmed replacing invalid data.
    try { return persist(freshProfile(cleanPlayerName(name))); }
    catch { return { status: 'bad-name' }; }
  },

  recordCareer(level, playerScore, computerScore, doubleCapture = null) {
    let config;
    try { config = careerLevel(level); }
    catch { return { status: 'invalid-level' }; }
    if (![playerScore, computerScore].every(validCounter)) return { status: 'invalid-score' };
    const current = this.read();
    if (!['empty', 'ready'].includes(current.status)) return current;
    if (level > current.profile.unlockedLevel) return { status: 'locked' };

    const profile = current.profile;
    const stats = { ...profile.stats, played: profile.stats.played + 1 };
    // Keep v1 counters consistent even on devices with very old profiles.
    if (!validCounter(stats.played)) return { status: 'limit' };
    const stars = { ...profile.stars };
    let earnedXP = 0;
    let awardedStars = 0;
    if (playerScore > computerScore) {
      stats.wins++;
      stats.streak++;
      stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
      const margin = (playerScore - computerScore) / Math.max(1, playerScore + computerScore);
      awardedStars = playerScore >= threeStarTarget(playerScore + computerScore) ? 3 : margin >= 0.2 ? 2 : 1;
      if (level === 3 && doubleCapture !== null) {
        awardedStars = doubleCapture ? 3 : Math.min(awardedStars, 2);
      }
      const oldStars = stars[level] || 0;
      if (awardedStars > oldStars) {
        earnedXP = (awardedStars - oldStars) * 50 + (oldStars === 0 ? 50 : 0);
        stars[level] = awardedStars;
      }
    } else if (playerScore === computerScore) {
      stats.draws++;
      stats.streak = 0;
    } else {
      stats.losses++;
      stats.streak = 0;
    }
    if (![stats.wins, stats.draws, stats.losses, stats.streak, stats.bestStreak]
      .every(validCounter) || !validCounter(profile.xp + earnedXP)) {
      return { status: 'limit' };
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
    if (saved.status !== 'ready') return saved;
    const earnedBefore = new Set(careerSummary(profile).achievements
      .filter(item => item.earned).map(item => item.id));
    const newAchievements = careerSummary(updated).achievements
      .filter(item => item.earned && !earnedBefore.has(item.id));
    return {
      ...saved, earnedXP, awardedStars, newAchievements,
      foxUnlocked: level === 5 && !profile.neonFoxUnlocked && Boolean(stars[5]),
      victory: playerScore > computerScore, level: config.level,
    };
  },
};
