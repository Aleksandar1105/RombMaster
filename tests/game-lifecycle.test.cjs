const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function harness({ storage = new Map(), autoStart = true } = {}) {
  const timers = new Map();
  const frames = new Map();
  let frameId = 0;
  const elements = new Map();
  let timerId = 0;
  const element = () => {
    const classes = new Set();
    return { textContent: '', classList: {
      add: value => classes.add(value),
      remove: value => classes.delete(value),
      contains: value => classes.has(value),
    } };
  };
  const getElement = id => {
    if (!elements.has(id)) elements.set(id, element());
    return elements.get(id);
  };
  const context = vm.createContext({
    console, window: {},
    document: { getElementById: getElement },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key),
    },
    requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
    clearTimeout(id) { timers.delete(id); },
  });
  const modules = new Map();
  function load(filename) {
    if (modules.has(filename)) return modules.get(filename);
    let module;
    if (path.basename(filename) === 'native.js') {
      module = new vm.SyntheticModule(['Native'], function () {
        this.setExport('Native', { vibrate() {} });
      }, { context, identifier: filename });
    } else if (path.basename(filename) === 'audio.js') {
      module = new vm.SyntheticModule(['AudioController'], function () {
        this.setExport('AudioController', class {
          init() {} move() {} score() {} win() {} pause() {} resume() {}
        });
      }, { context, identifier: filename });
    } else {
      module = new vm.SourceTextModule(fs.readFileSync(filename, 'utf8'), {
        context, identifier: filename,
      });
    }
    modules.set(filename, module);
    return module;
  }
  const entry = load(path.resolve(__dirname, '../src/game.js'));
  await entry.link((specifier, parent) => load(path.resolve(path.dirname(parent.identifier), specifier)));
  await entry.evaluate();
  const game = entry.namespace.Game;
  game.ui = Object.fromEntries(['viewMenu', 'viewGame', 'p1Score', 'p2Score',
    'p1Card', 'p2Card', 'undoBtn'].map(key => [key, element()]));
  game.renderer = { particles: [], resize() {}, spawnParticles() {} };
  if (autoStart) game.start(6, 'ai', 'normal');
  return { storage, save: modules.get(path.resolve(__dirname, '../src/save.js')).namespace, game, timers, frames, getElement, tick() {
    const batch = [...frames.entries()];
    for (const [id, callback] of batch) {
      frames.delete(id);
      callback();
    }
  }, fire() {
    const [id, callback] = timers.entries().next().value;
    timers.delete(id);
    callback();
  } };
}

function nonScoringMove(board, player = 1) {
  return board.getFreeMoves().find(move =>
    board.clone().makeMove(move.t, move.r, move.c, player).points === 0);
}

function scheduleFinish(game) {
  game.start(4, 'pvp', 'normal');
  while (game.board.getFreeMoves().length > 1) {
    const move = game.board.getFreeMoves()[0];
    game.board.makeMove(move.t, move.r, move.c, 1);
  }
  game.executeMove(game.board.getFreeMoves()[0]);
}

test('normal AI response still runs and releases thinking state', async () => {
  const h = await harness();
  h.game.executeMove(nonScoringMove(h.game.board));
  const before = h.game.board.getFreeMoves().length;
  assert.equal(h.timers.size, 1);
  h.fire();
  assert.equal(h.game.board.getFreeMoves().length, before - 1);
  assert.equal(h.game.aiThinking, false);
});

for (const mode of ['ai', 'pvp']) {
  test(`restart into ${mode} rejects a stale AI callback`, async () => {
    const h = await harness();
    h.game.executeMove(nonScoringMove(h.game.board));
    const stale = [...h.timers.values()][0];
    h.game.start(6, mode, 'normal');
    const before = JSON.stringify(h.game.board);
    assert.equal(h.timers.size, 0);
    stale(); // Also protect callbacks already queued by the event loop.
    assert.equal(JSON.stringify(h.game.board), before);
    assert.equal(h.game.historyStack.length, 0);
  });
}

test('leaving for menu cancels AI and rejects further moves', async () => {
  const h = await harness();
  h.game.executeMove(nonScoringMove(h.game.board));
  const stale = [...h.timers.values()][0];
  h.game.stop();
  const before = JSON.stringify(h.game.board);
  stale();
  h.game.runAI();
  h.game.executeMove(h.game.board.getFreeMoves()[0]);
  assert.equal(h.timers.size, 0);
  assert.equal(JSON.stringify(h.game.board), before);
});

test('undo before AI responds cancels the old response', async () => {
  const h = await harness();
  const before = JSON.stringify(h.game.board);
  h.game.executeMove(nonScoringMove(h.game.board));
  const stale = [...h.timers.values()][0];
  h.game.undo();
  stale();
  assert.equal(h.timers.size, 0);
  assert.equal(h.game.player, 1);
  assert.equal(JSON.stringify(h.game.board), before);
});

for (const action of ['restart', 'menu', 'undo']) {
  test(`${action} cancels a pending result screen`, async () => {
    const h = await harness();
    scheduleFinish(h.game);
    const stale = [...h.timers.values()][0];
    assert.equal(typeof stale, 'function');
    if (action === 'restart') h.game.start(6, 'pvp', 'normal');
    else if (action === 'menu') h.game.stop();
    else h.game.undo();
    stale();
    assert.equal(h.timers.size, 0);
    assert.equal(h.getElement('overlay').classList.contains('flex'), false);
    if (action !== 'menu') assert.equal(h.game.gameOver, false);
  });
}

test('completed board still opens the result screen', async () => {
  const h = await harness();
  scheduleFinish(h.game);
  h.fire();
  assert.equal(h.game.gameOver, true);
  assert.equal(h.getElement('overlay').classList.contains('flex'), true);
});

test('AI cannot play directly in PvP or during the human turn', async () => {
  const h = await harness();
  for (const mode of ['ai', 'pvp']) {
    h.game.start(6, mode, 'normal');
    if (mode === 'pvp') h.game.player = 0;
    const before = JSON.stringify(h.game.board);
    h.game.runAI();
    assert.equal(JSON.stringify(h.game.board), before);
  }
});

function scoringMove(board, player = 0) {
  return board.getFreeMoves().find(move =>
    board.clone().makeMove(move.t, move.r, move.c, player).points > 0);
}

function chainFixture(game) {
  // Find a legal position where a human move hands at least two captures to AI.
  const board = game.board.clone();
  while (!board.isGameOver()) {
    for (const move of board.getFreeMoves()) {
      const next = board.clone();
      if (next.makeMove(move.t, move.r, move.c, 1).points) continue;
      let captures = 0, scorer;
      while ((scorer = scoringMove(next))) {
        next.makeMove(scorer.t, scorer.r, scorer.c, 0);
        captures++;
      }
      if (captures >= 2 && !next.isGameOver()) return { board, move };
    }
    const move = board.getFreeMoves()[0];
    board.makeMove(move.t, move.r, move.c, 1);
  }
  throw new Error('No chain fixture found');
}

test('undo after AI reply restores the human decision and allows another move', async () => {
  const h = await harness();
  const before = JSON.stringify(h.game.board);
  h.game.executeMove(nonScoringMove(h.game.board));
  h.fire();
  h.game.undo();
  assert.equal(JSON.stringify(h.game.board), before);
  assert.equal(h.game.player, 1);
  assert.equal(h.game.historyStack.length, 0);
  assert.equal(h.game.lastMove, null);
  assert.equal(h.timers.size, 0);
  h.game.executeMove(nonScoringMove(h.game.board));
  assert.equal(h.game.historyStack.length, 1);
  assert.equal(h.timers.size, 1);
});

for (const phase of ['during', 'after']) {
  test(`undo ${phase} an AI capture chain restores scores, board and human turn`, async () => {
    const h = await harness();
    const fixture = chainFixture(h.game);
    h.game.board = fixture.board;
    const before = JSON.stringify(h.game.board);
    const initialAIScore = h.game.board.score[0];
    h.game.executeMove(fixture.move);
    h.fire();
    h.fire();
    assert.ok(h.game.board.score[0] >= initialAIScore + 2);
    assert.equal(h.game.player, 0);
    if (phase === 'after') {
      let limit = 200;
      while (h.game.player === 0 && !h.game.board.isGameOver() && limit-- > 0) h.fire();
      assert.equal(h.game.player, 1);
      assert.ok(limit > 0);
    }
    const stale = [...h.timers.values()];
    h.game.renderer.particles.push({ life: 1 });
    h.game.undo();
    stale.forEach(callback => callback());
    assert.equal(JSON.stringify(h.game.board), before);
    assert.equal(h.game.player, 1);
    assert.equal(h.game.historyStack.length, 0);
    assert.equal(h.game.renderer.particles.length, 0);
    assert.equal(h.timers.size, 0);
    assert.equal(h.game.ui.p1Score.textContent, h.game.board.score[1]);
    assert.equal(h.game.ui.p2Score.textContent, h.game.board.score[0]);
  });
}

test('PvP undo removes one move and restores the prior highlight', async () => {
  const h = await harness();
  h.game.start(6, 'pvp', 'normal');
  const first = nonScoringMove(h.game.board);
  h.game.executeMove(first);
  const before = JSON.stringify(h.game.board);
  h.game.executeMove(nonScoringMove(h.game.board, 0));
  h.game.undo();
  assert.equal(JSON.stringify(h.game.board), before);
  assert.equal(JSON.stringify(h.game.lastMove), JSON.stringify(first));
  assert.equal(h.game.player, 0);
  assert.equal(h.game.historyStack.length, 1);
  h.game.undo();
  assert.equal(h.game.lastMove, null);
  assert.equal(h.game.historyStack.length, 0);
  h.game.undo();
  assert.equal(h.game.historyStack.length, 0);
});

test('human extra turn undo preserves earlier captures', async () => {
  const h = await harness();
  const fixture = chainFixture(h.game);
  h.game.board = fixture.board;
  h.game.board.makeMove(fixture.move.t, fixture.move.r, fixture.move.c, 0);
  h.game.executeMove(scoringMove(h.game.board, 1));
  assert.equal(h.game.player, 1);
  const before = JSON.stringify(h.game.board);
  const lastMove = JSON.stringify(h.game.lastMove);
  h.game.executeMove(scoringMove(h.game.board, 1));
  h.game.undo();
  assert.equal(JSON.stringify(h.game.board), before);
  assert.equal(JSON.stringify(h.game.lastMove), lastMove);
  assert.equal(h.game.player, 1);
  assert.equal(h.game.historyStack.length, 1);
});

test('replaying an occupied edge does not create a phantom undo entry', async () => {
  const h = await harness();
  const move = nonScoringMove(h.game.board);
  h.game.executeMove(move);
  const before = JSON.stringify(h.game.board);
  h.game.executeMove(move);
  assert.equal(h.game.historyStack.length, 1);
  assert.equal(JSON.stringify(h.game.board), before);
});

test('undo cannot reopen a stopped or completed game', async () => {
  const h = await harness();
  h.game.executeMove(nonScoringMove(h.game.board));
  h.game.stop();
  const before = JSON.stringify(h.game.board);
  h.game.undo();
  assert.equal(JSON.stringify(h.game.board), before);
  assert.equal(h.game.gameOver, true);
  scheduleFinish(h.game);
  h.fire();
  h.game.undo();
  assert.equal(h.game.board.isGameOver(), true);
  assert.equal(h.getElement('overlay').classList.contains('flex'), true);
});

test('twenty restarts leave one frame and one draw per tick', async () => {
  const h = await harness();
  let draws = 0;
  h.game.renderer.draw = () => draws++;
  for (let i = 0; i < 20; i++) h.game.start(6, 'pvp', 'normal');
  assert.equal(h.frames.size, 1);
  for (let i = 1; i <= 5; i++) {
    h.tick();
    assert.equal(draws, i);
    assert.equal(h.frames.size, 1);
  }
});

test('a stale frame cannot draw or clear the new game frame', async () => {
  const h = await harness();
  const stale = [...h.frames.values()][0];
  let draws = 0;
  h.game.renderer.draw = () => draws++;
  h.game.start(6, 'pvp', 'normal');
  const currentFrame = h.game.animationFrame;
  stale();
  assert.equal(draws, 0);
  assert.equal(h.game.animationFrame, currentFrame);
  assert.equal(h.frames.size, 1);
  h.tick();
  assert.equal(draws, 1);
  assert.equal(h.frames.size, 1);
});

test('menu exit cancels the frame even when particles remain', async () => {
  const h = await harness();
  const stale = [...h.frames.values()][0];
  let draws = 0;
  h.game.renderer.draw = () => draws++;
  h.game.renderer.particles.push({ life: 1 });
  h.game.stop();
  h.game.ui.viewGame.classList.add('hidden');
  stale();
  h.game.requestRender();
  assert.equal(draws, 0);
  assert.equal(h.frames.size, 0);
  assert.equal(h.game.animationFrame, null);
});

test('completed game drains remaining effects then stops scheduling frames', async () => {
  const h = await harness();
  scheduleFinish(h.game);
  h.fire();
  h.game.renderer.particles = [{}, {}, {}];
  let draws = 0;
  h.game.renderer.draw = () => { draws++; h.game.renderer.particles.pop(); };
  h.tick();
  assert.equal(h.frames.size, 1);
  h.tick();
  assert.equal(h.frames.size, 1);
  h.tick();
  assert.equal(draws, 3);
  assert.equal(h.frames.size, 0);
  assert.equal(h.game.animationFrame, null);
});

test('completed board can repaint once without restarting an endless loop', async () => {
  const h = await harness();
  scheduleFinish(h.game);
  h.fire();
  let draws = 0;
  h.game.renderer.draw = () => draws++;
  h.tick();
  assert.equal(h.frames.size, 0);
  h.game.requestRender();
  h.game.requestRender();
  assert.equal(h.frames.size, 1);
  h.tick();
  assert.equal(draws, 2);
  assert.equal(h.frames.size, 0);
});

test('hidden game drops its queued frame without drawing', async () => {
  const h = await harness();
  let draws = 0;
  h.game.renderer.draw = () => draws++;
  h.game.ui.viewGame.classList.add('hidden');
  h.tick();
  assert.equal(draws, 0);
  assert.equal(h.frames.size, 0);
});

for (const size of [4, 6, 8]) {
  test(`reload restores size ${size}, scores, turn, highlight and working Undo`, async () => {
    const first = await harness();
    first.game.start(size, 'pvp', 'hard');
    for (let i = 0; i < 5; i++) first.game.executeMove(first.game.board.getFreeMoves()[0]);
    const before = JSON.stringify(first.game.board);
    const history = JSON.stringify(first.game.historyStack);
    const last = JSON.stringify(first.game.lastMove);
    const second = await harness({ storage: first.storage, autoStart: false });
    assert.equal(second.game.resume(), true);
    assert.equal(JSON.stringify(second.game.board), before);
    assert.equal(JSON.stringify(second.game.historyStack), history);
    assert.equal(JSON.stringify(second.game.lastMove), last);
    assert.equal(second.game.player, first.game.player);
    assert.equal(second.game.settings.size, size);
    assert.equal(second.game.settings.diff, 'hard');
    assert.equal(typeof second.game.board.clone, 'function');
    const undoBoard = JSON.stringify(first.game.historyStack.at(-1).boardState);
    second.game.undo();
    assert.equal(JSON.stringify(second.game.board), undoBoard);
    const third = await harness({ storage: first.storage, autoStart: false });
    assert.equal(third.game.resume(), true);
    assert.equal(JSON.stringify(third.game.board), undoBoard);
  });
}

test('reload during AI delay schedules one response, and undo still restores human turn', async () => {
  const first = await harness();
  first.game.executeMove(nonScoringMove(first.game.board));
  const second = await harness({ storage: first.storage, autoStart: false });
  assert.equal(second.game.resume(), true);
  assert.equal(second.game.player, 0);
  assert.equal(second.timers.size, 1);
  second.game.resume();
  assert.equal(second.timers.size, 1);
  assert.equal(second.frames.size, 1);
  second.fire();
  assert.equal(second.game.historyStack.length, 2);
  second.game.undo();
  assert.equal(second.game.player, 1);
  assert.equal(second.game.historyStack.length, 0);
  assert.equal(second.timers.size, 0);
});

test('validated legacy snapshots migrate with undo history intact', async () => {
  const h = await harness();
  h.game.start(6, 'pvp', 'normal');
  for (let i = 0; i < 5; i++) h.game.executeMove(h.game.board.getFreeMoves()[0]);
  const expected = JSON.stringify(h.game.board);
  h.storage.set('rhombus_save', JSON.stringify({ board: h.game.board,
    player: h.game.player, settings: h.game.settings, history: h.game.historyStack }));
  const restored = await harness({ storage: h.storage, autoStart: false });
  assert.equal(restored.game.resume(), true);
  assert.equal(JSON.stringify(restored.game.board), expected);
  assert.equal(restored.game.historyStack.length, 5);
  assert.equal(JSON.parse(h.storage.get('rhombus_save')).version, 1);
});

for (const [label, raw] of [
  ['broken JSON', '{'],
  ['unknown version', JSON.stringify({ version: 999, settings: { size: 6, mode: 'ai', diff: 'normal' }, moves: [] })],
  ['invalid size', JSON.stringify({ version: 1, settings: { size: 1000, mode: 'ai', diff: 'normal' }, moves: [] })],
  ['invalid coordinate', JSON.stringify({ version: 1, settings: { size: 6, mode: 'ai', diff: 'normal' }, moves: [{ t: 'h', r: -1, c: 0 }] })],
]) {
  test(`${label} is rejected without deleting the saved data`, async () => {
    const storage = new Map([['rhombus_save', raw]]);
    const h = await harness({ storage, autoStart: false });
    assert.equal(h.game.resume(), false);
    assert.equal(h.game.board, null);
    assert.equal(storage.get('rhombus_save'), raw);
    assert.equal(h.getElement('continueBtn').hidden, true);
    assert.ok(h.getElement('save-status').textContent.includes('could not be loaded'));
  });
}

test('duplicate saved moves and tampered legacy scores are rejected', async () => {
  const h = await harness();
  h.game.executeMove(nonScoringMove(h.game.board));
  const data = JSON.parse(h.storage.get('rhombus_save'));
  data.moves.push(data.moves[0]);
  h.storage.set('rhombus_save', JSON.stringify(data));
  assert.equal(h.save.SaveStore.read().status, 'invalid');
  const legacy = { settings: h.game.settings, player: h.game.player,
    board: h.game.board, history: h.game.historyStack };
  legacy.board.score[0] += 100;
  h.storage.set('rhombus_save', JSON.stringify(legacy));
  assert.equal(h.save.SaveStore.read().status, 'invalid');
});

test('storage read/write failures do not interrupt play or undo', async () => {
  const storage = { get() { throw Error('denied'); }, set() { throw Error('quota'); }, delete() { throw Error('denied'); } };
  const h = await harness({ storage });
  assert.equal(h.game.refreshSavedGame().status, 'unavailable');
  h.game.executeMove(nonScoringMove(h.game.board));
  assert.equal(h.game.historyStack.length, 1);
  assert.ok(h.getElement('game-save-status').textContent.includes('Could not save'));
  h.game.undo();
  assert.equal(h.game.historyStack.length, 0);
  assert.equal(h.game.player, 1);
  assert.equal(h.game.resume(), false);
});

test('finished move logs are not offered as Continue even if deletion fails', async () => {
  const h = await harness();
  h.game.start(4, 'pvp', 'normal');
  while (!h.game.board.isGameOver()) h.game.executeMove(h.game.board.getFreeMoves()[0]);
  const completed = h.storage.get('rhombus_save');
  const restored = await harness({ storage: new Map([['rhombus_save', completed]]), autoStart: false });
  assert.equal(restored.game.refreshSavedGame().status, 'finished');
  assert.equal(restored.game.resume(), false);
  assert.equal(restored.getElement('continueBtn').hidden, true);
  h.fire();
  assert.equal(h.storage.has('rhombus_save'), false);
});

test('empty storage offers no Continue and a new game saves immediately', async () => {
  const h = await harness({ autoStart: false });
  assert.equal(h.game.refreshSavedGame().status, 'empty');
  assert.equal(h.getElement('continueBtn').hidden, true);
  h.game.start(8, 'pvp', 'hard');
  const saved = h.save.SaveStore.read();
  assert.equal(saved.status, 'ready');
  assert.equal(saved.state.settings.size, 8);
  assert.equal(saved.state.moves.length, 0);
});

test('backgrounding saves and cancels AI/frames; duplicate resumes queue only one response', async () => {
  const h = await harness();
  h.game.executeMove(nonScoringMove(h.game.board));
  const before = JSON.stringify(h.game.board);
  const stale = [...h.timers.values()][0];
  h.game.setActive('native', false);
  h.game.setActive('visibility', false);
  assert.equal(h.game.paused, true);
  assert.equal(h.timers.size, 0);
  assert.equal(h.frames.size, 0);
  stale();
  h.game.runAI();
  h.game.executeMove(h.game.board.getFreeMoves()[0]);
  h.game.undo();
  assert.equal(JSON.stringify(h.game.board), before);
  assert.equal(JSON.stringify(h.save.SaveStore.read().state.board), before);
  h.game.setActive('native', true);
  assert.equal(h.game.paused, true);
  assert.equal(h.timers.size, 0);
  h.game.setActive('visibility', true);
  h.game.setActive('native', true);
  h.game.setActive('visibility', true);
  assert.equal(h.game.paused, false);
  assert.equal(h.timers.size, 1);
  assert.equal(h.frames.size, 1);
  h.fire();
  assert.equal(h.game.historyStack.length, 2);
});

test('human turn resumes without an unsolicited AI move', async () => {
  const h = await harness();
  h.game.setActive('visibility', false);
  h.game.setActive('visibility', true);
  assert.equal(h.game.player, 1);
  assert.equal(h.timers.size, 0);
  assert.equal(h.frames.size, 1);
});

test('pending game result is deferred until foreground and displayed once', async () => {
  const h = await harness();
  scheduleFinish(h.game);
  const stale = [...h.timers.values()][0];
  h.game.setActive('native', false);
  stale();
  assert.equal(h.getElement('overlay').classList.contains('flex'), false);
  h.game.setActive('native', true);
  h.game.setActive('native', true);
  assert.equal(h.timers.size, 1);
  h.fire();
  assert.equal(h.getElement('overlay').classList.contains('flex'), true);
  assert.equal(h.game.gameOver, true);
});

test('foregrounding the menu does not restart the abandoned board', async () => {
  const h = await harness();
  h.game.executeMove(nonScoringMove(h.game.board));
  h.game.stop();
  h.game.ui.viewGame.classList.add('hidden');
  const saved = h.storage.get('rhombus_save');
  h.game.setActive('native', false);
  h.game.setActive('native', true);
  assert.equal(h.frames.size, 0);
  assert.equal(h.timers.size, 0);
  assert.equal(h.storage.get('rhombus_save'), saved);
});

test('restoring a saved AI turn while hidden waits until foreground', async () => {
  const h = await harness();
  h.game.executeMove(nonScoringMove(h.game.board));
  const restored = await harness({ storage: h.storage, autoStart: false });
  restored.game.setActive('visibility', false);
  assert.equal(restored.game.resume(), true);
  assert.equal(restored.frames.size, 0);
  assert.equal(restored.timers.size, 0);
  restored.game.setActive('visibility', true);
  assert.equal(restored.frames.size, 1);
  assert.equal(restored.timers.size, 1);
});


test('turn banner explains human, AI, background pause and foreground resume', async () => {
  const h = await harness();
  const label = h.getElement('turn-label');
  const hint = h.getElement('turn-hint');
  assert.equal(label.textContent, 'Your turn');
  assert.ok(hint.textContent.includes('dots'));

  h.game.executeMove(nonScoringMove(h.game.board));
  assert.equal(label.textContent, 'Computer thinking…');
  assert.equal(h.timers.size, 1);

  h.game.setActive('native', false);
  assert.equal(label.textContent, 'Game paused');
  assert.equal(h.timers.size, 0);
  h.game.setActive('native', true);
  assert.equal(label.textContent, 'Computer thinking…');
  assert.equal(h.timers.size, 1);
});

test('turn banner reports PvP players and earned extra turns', async () => {
  const h = await harness();
  h.game.start(6, 'pvp', 'normal');
  assert.equal(h.getElement('turn-label').textContent, "Player 1's turn");
  h.game.executeMove(nonScoringMove(h.game.board));
  assert.equal(h.getElement('turn-label').textContent, "Player 2's turn");

  // An earned extra turn is detected from the previous snapshot's score
  // and player; the banner must not change any gameplay state.
  const before = JSON.stringify(h.game.board);
  const scoreBefore = h.game.board.score[h.game.player];
  h.game.historyStack.push({
    player: h.game.player,
    score: [...h.game.board.score],
  });
  h.game.board.score[h.game.player] += 1;
  h.game.updateTurnStatus();
  assert.equal(h.getElement('turn-label').textContent, 'Player 2 gets another turn');
  assert.ok(h.getElement('turn-hint').textContent.includes('captured'));
  assert.equal(h.game.player, 0);
  assert.equal(h.game.board.score[h.game.player], scoreBefore + 1);
  assert.notEqual(JSON.stringify(h.game.board), before);
});


test('career reward is saved on the finishing move before delayed result', async () => {
  const h = await harness();
  assert.equal(h.game.start(4, 'ai', 'easy', 1), true);
  while (h.game.board.getFreeMoves().length > 1) {
    const move = h.game.board.getFreeMoves()[0];
    h.game.board.makeMove(move.t, move.r, move.c, 1);
  }
  h.game.player = 1;
  h.game.executeMove(h.game.board.getFreeMoves()[0]);
  const profile = JSON.parse(h.storage.get('rombmaster_profile_v1'));
  assert.equal(profile.unlockedLevel, 2);
  assert.equal(profile.stats.played, 1);
  // The delayed overlay must never award the same match a second time.
  h.fire();
  const after = JSON.parse(h.storage.get('rombmaster_profile_v1'));
  assert.equal(after.stats.played, 1);
  assert.equal(h.getElement('nextCareerBtn').hidden, false);
});

test('locked career levels cannot be started directly', async () => {
  const h = await harness();
  const boardBefore = JSON.stringify(h.game.board);
  assert.equal(h.game.start(6, 'ai', 'normal', 11), false);
  assert.equal(JSON.stringify(h.game.board), boardBefore);
  assert.equal(h.game.settings.careerLevel, undefined);
});


test('committed career win cannot be undone in the result delay', async () => {
  const h = await harness();
  h.game.start(4, 'ai', 'easy', 1);
  while (h.game.board.getFreeMoves().length > 1) {
    const move = h.game.board.getFreeMoves()[0];
    h.game.board.makeMove(move.t, move.r, move.c, 1);
  }
  h.game.player = 1;
  h.game.executeMove(h.game.board.getFreeMoves()[0]);
  const finalBoard = JSON.stringify(h.game.board);
  const savedProfile = h.storage.get('rombmaster_profile_v1');
  h.game.undo();
  assert.equal(JSON.stringify(h.game.board), finalBoard);
  assert.equal(h.storage.get('rombmaster_profile_v1'), savedProfile);
  assert.equal(h.game.ui.undoBtn.classList.contains('disabled'), true);
});
