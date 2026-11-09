const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function harness() {
  const storage = new Map();
  const context = vm.createContext({
    localStorage: {
      getItem(key) { return storage.get(key) ?? null; },
      setItem(key, value) { storage.set(key, value); },
    },
  });
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename);
    const mod = new vm.SourceTextModule(
      fs.readFileSync(path.join(__dirname, '..', 'src', filename), 'utf8'),
      { context, identifier: filename }
    );
    cache.set(filename, mod);
    return mod;
  }
  const progress = load('daily-progress.js');
  await progress.link((specifier) => load(path.basename(specifier)));
  await progress.evaluate();
  return {
    daily: cache.get('daily-challenge.js').namespace,
    Board: cache.get('board.js').namespace.Board,
    progress: progress.namespace.DailyProgress,
    storage,
  };
}

test('all three tactical tasks have genuine legal solutions and reproducible positions', async () => {
  const { daily } = await harness();
  for (let month = 1; month <= 12; month++) {
    const day = `2026-${String(month).padStart(2, '0')}-15`;
    for (let i = 0; i < 3; i++) {
      const puzzle = daily.createDailyPuzzle(day, i);
      const positions = JSON.stringify(puzzle.board);
      const repeat = daily.createDailyPuzzle(day, i);
      assert.equal(JSON.stringify(repeat.board), positions);
      const moves = puzzle.board.getFreeMoves();
      const winning = moves.filter(move => daily.evaluateDailyMove(puzzle, move).correct);
      assert.ok(winning.length, `${day} puzzle ${i} has no winning move`);
      if (i === 1) assert.ok(winning.length < moves.length,
        'defensive puzzle must have at least one risky alternative');
      assert.equal(daily.evaluateDailyMove(puzzle, { t: 'h', r: -9, c: -1 }).correct, false);
    }
  }
});

test('daily completion awards points exactly once and does not alter Career saves', async () => {
  const h = await harness();
  const date = '2026-11-09';
  h.storage.set('rhombus_save', '{"untouched":true}');
  h.storage.set('rombmaster_profile_v1', '{"untouched":true}');
  assert.equal(h.progress.read(date).progress.solved, 0);
  assert.equal(h.progress.recordSolved(date, 1).status, 'out-of-order');
  for (let index = 0; index < 3; index++) {
    const result = h.progress.recordSolved(date, index);
    assert.equal(result.status, 'ready');
    assert.equal(result.progress.solved, index + 1);
  }
  assert.equal(h.progress.read(date).progress.brainPoints, 30);
  assert.equal(h.progress.recordSolved(date, 2).status, 'out-of-order');
  assert.equal(h.progress.read(date).progress.completedTotal, 1);
  assert.equal(h.storage.get('rhombus_save'), '{"untouched":true}');
  assert.equal(h.storage.get('rombmaster_profile_v1'), '{"untouched":true}');
});

test('streak is optional: next-day completion advances it, a missed day resets it', async () => {
  const h = await harness();
  for (const date of ['2026-11-09', '2026-11-10', '2026-11-12']) {
    for (let index = 0; index < 3; index++) {
      assert.equal(h.progress.recordSolved(date, index).status, 'ready');
    }
  }
  const state = h.progress.read('2026-11-12');
  assert.equal(state.progress.streak, 1);
  assert.equal(state.progress.completedTotal, 3);
  assert.equal(state.progress.brainPoints, 90);
  assert.equal(h.progress.read('2026-11-11').status, 'clock-changed');
});

test('corrupted daily data is never overwritten without recovery', async () => {
  const h = await harness();
  const original = '{corrupt data';
  h.storage.set('rombmaster_daily_progress_v1', original);
  assert.equal(h.progress.read('2026-11-09').status, 'invalid');
  assert.equal(h.progress.recordSolved('2026-11-09', 0).status, 'invalid');
  assert.equal(h.storage.get('rombmaster_daily_progress_v1'), original);
  assert.equal(h.daily.validDateKey('2026-02-30'), false);
});

test('daily points and puzzle progress stay independent for each local player', async () => {
  const h = await harness();
  const date = '2026-11-09';
  const profile = new vm.SourceTextModule(
    fs.readFileSync(path.join(__dirname, '..', 'src', 'profile.js'), 'utf8'),
    { context: vm.createContext({ localStorage: {
      getItem: key => h.storage.get(key) ?? null,
      setItem: (key, value) => h.storage.set(key, value),
      removeItem: key => h.storage.delete(key),
    } }) }
  );
  await profile.link(() => { throw Error('No profile imports expected'); });
  await profile.evaluate();
  const slots = profile.namespace.LocalSlots;
  assert.equal(h.progress.recordSolved(date, 0).status, 'ready');
  assert.equal(slots.createPlayer('Lina').status, 'ready');
  assert.equal(h.progress.read(date).progress.solved, 0);
  for (let i = 0; i < 3; i++) {
    assert.equal(h.progress.recordSolved(date, i).status, 'ready');
  }
  assert.equal(h.progress.read(date).progress.brainPoints, 30);
  assert.equal(slots.switchTo('guest').status, 'ready');
  assert.equal(h.progress.read(date).progress.solved, 1);
  assert.equal(h.progress.read(date).progress.brainPoints, 0);
  assert.equal(slots.switchTo('slot-1').status, 'ready');
  assert.equal(h.progress.read(date).progress.solved, 3);
});
