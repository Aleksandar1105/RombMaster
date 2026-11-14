const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function profileHarness(storage = new Map()) {
  const context = vm.createContext({
    localStorage: {
      getItem(key) { return storage.get(key) ?? null; },
      setItem(key, value) { storage.set(key, value); },
      removeItem(key) { storage.delete(key); },
    },
  });
  const mod = new vm.SourceTextModule(
    fs.readFileSync(path.resolve(__dirname, '../src/profile.js'), 'utf8'),
    { context }
  );
  await mod.link(() => { throw new Error('No profile imports expected'); });
  await mod.evaluate();
  return { ...mod.namespace, storage };
}

test('offline profile starts as guest, saves a name and survives reinitialization', async () => {
  const storage = new Map();
  const h = await profileHarness(storage);
  assert.equal(h.ProfileStore.read().status, 'empty');
  assert.equal(h.ProfileStore.saveName('  Alex   Player  ').status, 'ready');
  const again = await profileHarness(storage);
  assert.equal(again.ProfileStore.read().profile.name, 'Alex Player');
  assert.equal(again.ProfileStore.read().profile.unlockedLevel, 1);
});

test('campaign board and AI tiers change at level 11 and 21', async () => {
  const h = await profileHarness();
  for (const [level, size, diff] of [
    [1, 4, 'easy'], [10, 4, 'easy'],
    [11, 6, 'normal'], [20, 6, 'normal'],
    [21, 8, 'hard'], [30, 8, 'hard'],
  ]) {
    const stage = h.careerLevel(level);
    assert.equal(stage.size, size);
    assert.equal(stage.diff, diff);
  }
  assert.throws(() => h.careerLevel(31));
  assert.throws(() => h.careerLevel(0));
});

test('career wins unlock next level, repeated victories only reward star improvements', async () => {
  const h = await profileHarness();
  assert.equal(h.ProfileStore.recordCareer(2, 20, 5).status, 'locked');
  const first = h.ProfileStore.recordCareer(1, 7, 6);
  assert.equal(first.status, 'ready');
  assert.equal(first.awardedStars, 1);
  assert.equal(first.earnedXP, 100);
  assert.equal(first.profile.unlockedLevel, 2);
  const same = h.ProfileStore.recordCareer(1, 7, 6);
  assert.equal(same.earnedXP, 0);
  const better = h.ProfileStore.recordCareer(1, 10, 2);
  assert.equal(better.awardedStars, 3);
  assert.equal(better.earnedXP, 100);
  assert.equal(better.profile.xp, 200);
  assert.equal(better.profile.stars[1], 3);
  assert.equal(better.profile.stats.played, 3);
  assert.equal(better.profile.stats.wins, 3);
});

test('draws and losses track statistics without unlocking levels', async () => {
  const h = await profileHarness();
  h.ProfileStore.recordCareer(1, 4, 4);
  const loss = h.ProfileStore.recordCareer(1, 3, 7);
  assert.equal(loss.profile.unlockedLevel, 1);
  assert.equal(loss.profile.stats.draws, 1);
  assert.equal(loss.profile.stats.losses, 1);
  assert.equal(loss.profile.xp, 0);
});

test('bad names and tampered profiles cannot overwrite stored progress', async () => {
  const h = await profileHarness();
  assert.equal(h.ProfileStore.saveName('x'.repeat(19)).status, 'bad-name');
  assert.equal(h.ProfileStore.saveName('Valid Name').status, 'ready');
  h.storage.set(h.PROFILE_KEY, '{bad');
  const before = h.storage.get(h.PROFILE_KEY);
  assert.equal(h.ProfileStore.read().status, 'invalid');
  assert.equal(h.ProfileStore.saveName('Another').status, 'invalid');
  assert.equal(h.ProfileStore.recordCareer(1, 10, 2).status, 'invalid');
  assert.equal(h.storage.get(h.PROFILE_KEY), before);
});

test('resetCareer returns to level one but preserves name, avatar and other storage keys', async () => {
  const h = await profileHarness();
  h.ProfileStore.saveName('Pilot');
  h.ProfileStore.saveAvatar('fox');
  h.ProfileStore.recordCareer(1, 9, 1);
  h.storage.set('rhombus_save', 'quick-match-marker');
  h.storage.set('rombmaster_daily_progress_v1', 'daily-marker');
  const result = h.ProfileStore.resetCareer();
  assert.equal(result.status, 'ready');
  assert.equal(result.profile.name, 'Pilot');
  assert.equal(result.profile.avatar, 'fox');
  assert.equal(result.profile.unlockedLevel, 1);
  assert.equal(result.profile.xp, 0);
  assert.equal(result.profile.stats.played, 0);
  assert.equal(h.careerSummary(result.profile).earnedAchievements, 0);
  assert.equal(Object.keys(result.profile.stars).length, 0);
  assert.equal(h.storage.get('rhombus_save'), 'quick-match-marker');
  assert.equal(h.storage.get('rombmaster_daily_progress_v1'), 'daily-marker');
});

test('resetCareer refuses invalid data instead of destroying it', async () => {
  const h = await profileHarness();
  h.storage.set(h.PROFILE_KEY, '{broken');
  const prior = h.storage.get(h.PROFILE_KEY);
  assert.equal(h.ProfileStore.resetCareer().status, 'invalid');
  assert.equal(h.storage.get(h.PROFILE_KEY), prior);
});

test('profile rejects inconsistent records', async () => {
  const h = await profileHarness();
  h.ProfileStore.saveName('Hero');
  const p = JSON.parse(h.storage.get(h.PROFILE_KEY));
  p.stats.wins = 2;
  h.storage.set(h.PROFILE_KEY, JSON.stringify(p));
  assert.equal(h.ProfileStore.read().status, 'invalid');
});

test('storage failures do not imply progress was recorded', async () => {
  const h = await profileHarness();
  const broken = vm.createContext({ localStorage: { getItem() { throw Error('denied'); } } });
  const mod = new vm.SourceTextModule(fs.readFileSync(path.resolve(__dirname, '../src/profile.js'), 'utf8'), { context: broken });
  await mod.link(() => {});
  await mod.evaluate();
  assert.equal(mod.namespace.ProfileStore.read().status, 'unavailable');
  assert.equal(h.ProfileStore.read().status, 'empty');
});


test('older v1 profiles migrate avatar and streak defaults without losing progress', async () => {
  const h = await profileHarness();
  const legacy = {
    version: 1, name: 'Veteran', xp: 350, unlockedLevel: 2,
    stars: { 1: 3 },
    stats: { played: 4, wins: 3, draws: 0, losses: 1 },
  };
  h.storage.set(h.PROFILE_KEY, JSON.stringify(legacy));
  const loaded = h.ProfileStore.read();
  assert.equal(loaded.status, 'ready');
  assert.equal(loaded.profile.avatar, 'spark');
  assert.equal(loaded.profile.stats.streak, 0);
  assert.equal(loaded.profile.stats.bestStreak, 0);
  assert.equal(loaded.profile.xp, 350);
  assert.equal(loaded.profile.stars[1], 3);
  assert.equal(loaded.profile.unlockedLevel, 2);
  assert.equal(h.ProfileStore.saveAvatar('fox').status, 'ready');
  const updated = h.ProfileStore.read().profile;
  assert.equal(updated.avatar, 'fox');
  assert.equal(updated.xp, 350);
  assert.equal(updated.stats.wins, 3);
  assert.equal(updated.stars[1], 3);
});

test('avatar settings are restricted to known presets', async () => {
  const h = await profileHarness();
  const initial = h.ProfileStore.saveName('Pilot');
  assert.equal(initial.status, 'ready');
  const original = h.storage.get(h.PROFILE_KEY);
  for (const avatar of ['../../secret.png', '<img>', '🕵️', '', null, 42]) {
    assert.equal(h.ProfileStore.saveAvatar(avatar).status, 'bad-avatar');
    assert.equal(h.storage.get(h.PROFILE_KEY), original);
  }
  assert.equal(h.ProfileStore.saveAvatar('neon-fox').status, 'locked');
  for (let level = 1; level <= 5; level++) h.ProfileStore.recordCareer(level, 7, 2);
  for (const preset of h.PLAYER_AVATARS) {
    assert.equal(h.ProfileStore.saveAvatar(preset.id).status, 'ready');
    assert.equal(h.ProfileStore.read().profile.avatar, preset.id);
  }
});

test('career stats show win rate, stars and achievements from confirmed progress', async () => {
  const h = await profileHarness();
  let p = h.ProfileStore.read().profile;
  let overview = h.careerSummary(p);
  assert.equal(overview.winRate, 0);
  assert.equal(overview.earnedAchievements, 0);
  const first = h.ProfileStore.recordCareer(1, 9, 1);
  assert.equal(first.newAchievements.length, 1);
  assert.equal(first.newAchievements[0].id, 'first-win');
  overview = h.careerSummary(first.profile);
  assert.equal(overview.played, 1);
  assert.equal(overview.wins, 1);
  assert.equal(overview.winRate, 100);
  assert.equal(overview.totalStars, 3);
  assert.equal(overview.clearedLevels, 1);
  assert.equal(overview.streak, 1);
});

test('achievements unlock only at thresholds and cannot be earned twice', async () => {
  const h = await profileHarness();
  const newIds = [];
  for (let level = 1; level <= 11; level++) {
    const outcome = h.ProfileStore.recordCareer(level, 9, 1);
    assert.equal(outcome.status, 'ready');
    newIds.push(...outcome.newAchievements.map(item => item.id));
  }
  assert.equal(newIds.filter(id => id === 'first-win').length, 1);
  assert.equal(newIds.filter(id => id === 'five-wins').length, 1);
  assert.equal(newIds.filter(id => id === 'streak-three').length, 1);
  assert.equal(newIds.filter(id => id === 'ten-stars').length, 1);
  assert.equal(newIds.filter(id => id === 'strategist').length, 1);
  const after = h.ProfileStore.recordCareer(1, 9, 1);
  assert.deepEqual([...after.newAchievements], []);
  const summary = h.careerSummary(after.profile);
  assert.equal(summary.bestStreak, 12);
  assert.equal(summary.earnedAchievements, 5);
});

test('draw or loss resets current streak while preserving previous best', async () => {
  const h = await profileHarness();
  h.ProfileStore.recordCareer(1, 8, 2);
  h.ProfileStore.recordCareer(1, 8, 2);
  const draw = h.ProfileStore.recordCareer(1, 5, 5);
  assert.equal(draw.profile.stats.streak, 0);
  assert.equal(draw.profile.stats.bestStreak, 2);
  h.ProfileStore.recordCareer(1, 8, 2);
  const lost = h.ProfileStore.recordCareer(1, 2, 8);
  assert.equal(lost.profile.stats.streak, 0);
  assert.equal(lost.profile.stats.bestStreak, 2);
});

test('invalid avatars and impossible streaks never silently overwrite stored data', async () => {
  const h = await profileHarness();
  h.ProfileStore.saveName('Guardian');
  const p = JSON.parse(h.storage.get(h.PROFILE_KEY));
  p.avatar = 'not-in-preset';
  h.storage.set(h.PROFILE_KEY, JSON.stringify(p));
  const invalidAvatar = h.storage.get(h.PROFILE_KEY);
  assert.equal(h.ProfileStore.read().status, 'invalid');
  assert.equal(h.ProfileStore.saveAvatar('robot').status, 'invalid');
  assert.equal(h.storage.get(h.PROFILE_KEY), invalidAvatar);

  p.avatar = 'spark';
  p.stats.streak = 3;
  p.stats.bestStreak = 1;
  h.storage.set(h.PROFILE_KEY, JSON.stringify(p));
  assert.equal(h.ProfileStore.read().status, 'invalid');
  assert.equal(h.ProfileStore.saveName('New Name').status, 'invalid');
});

test('guest legacy profile stays on original key when a new local player is created', async () => {
  const h = await profileHarness();
  h.ProfileStore.saveName('Veteran');
  h.ProfileStore.saveAvatar('fox');
  h.ProfileStore.recordCareer(1, 9, 1);
  const guestData = h.storage.get(h.PROFILE_KEY);
  const created = h.LocalSlots.createPlayer('Lina');
  assert.equal(created.status, 'ready');
  assert.equal(created.activeId, 'slot-1');
  assert.equal(h.ProfileStore.read().profile.name, 'Lina');
  assert.equal(h.ProfileStore.read().profile.xp, 0);
  assert.equal(h.ProfileStore.recordCareer(1, 10, 2).status, 'ready');
  assert.equal(h.LocalSlots.switchTo('guest').status, 'ready');
  assert.equal(h.ProfileStore.read().profile.name, 'Veteran');
  assert.equal(h.storage.get(h.PROFILE_KEY), guestData);
  assert.equal(h.ProfileStore.read().profile.unlockedLevel, 2);
  assert.equal(h.LocalSlots.switchTo('slot-1').status, 'ready');
  assert.equal(h.ProfileStore.read().profile.name, 'Lina');
  assert.equal(h.ProfileStore.read().profile.unlockedLevel, 2);
});

test('local slots reject duplicate names, invalid IDs and a fifth player', async () => {
  const h = await profileHarness();
  assert.equal(h.LocalSlots.createPlayer('Lina').status, 'ready');
  assert.equal(h.LocalSlots.createPlayer('lina').status, 'duplicate-name');
  assert.equal(h.LocalSlots.switchTo('slot-999').status, 'not-found');
  assert.equal(h.LocalSlots.createPlayer('Mila').status, 'ready');
  assert.equal(h.LocalSlots.createPlayer('Alex').status, 'ready');
  assert.equal(h.LocalSlots.createPlayer('Fifth').status, 'limit');
  assert.equal(h.LocalSlots.read().index.slots.length, 4);
});

test('corrupt slot index and missing registered slot data are never silently overwritten', async () => {
  const h = await profileHarness();
  h.storage.set(h.PLAYER_SLOTS_KEY, '{"version":2}');
  const badIndex = h.storage.get(h.PLAYER_SLOTS_KEY);
  assert.equal(h.LocalSlots.read().status, 'invalid');
  assert.equal(h.LocalSlots.createPlayer('New').status, 'invalid');
  assert.equal(h.storage.get(h.PLAYER_SLOTS_KEY), badIndex);
  h.storage.delete(h.PLAYER_SLOTS_KEY);
  assert.equal(h.LocalSlots.createPlayer('Lina').status, 'ready');
  h.storage.delete(`${h.PROFILE_KEY}:slot-1`);
  assert.equal(h.LocalSlots.switchTo('guest').status, 'ready');
  assert.equal(h.LocalSlots.switchTo('slot-1').status, 'invalid');
  assert.equal(h.LocalSlots.read().index.activeId, 'guest');
});
