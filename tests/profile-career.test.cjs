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
