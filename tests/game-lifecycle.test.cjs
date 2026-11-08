const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function harness() {
  const timers = new Map();
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
    localStorage: { setItem() {}, removeItem() {} },
    requestAnimationFrame() {},
    setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
    clearTimeout(id) { timers.delete(id); },
  });
  const modules = new Map();
  function load(filename) {
    if (modules.has(filename)) return modules.get(filename);
    let module;
    if (filename.endsWith('/native.js')) {
      module = new vm.SyntheticModule(['Native'], function () {
        this.setExport('Native', { vibrate() {} });
      }, { context, identifier: filename });
    } else if (filename.endsWith('/audio.js')) {
      module = new vm.SyntheticModule(['AudioController'], function () {
        this.setExport('AudioController', class {
          init() {} move() {} score() {} win() {}
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
  game.start(6, 'ai', 'normal');
  return { game, timers, getElement, fire() {
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
