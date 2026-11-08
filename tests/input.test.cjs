const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function boot({ storage = new Map(), autoStart = true, confirm = () => true } = {}) {
  const elements = new Map();
  const events = new Map();
  const nativeEvents = {};
  let exits = 0;
  function el(id) {
    if (elements.has(id)) return elements.get(id);
    const listeners = new Map(), classes = new Set();
    const element = {
      style: {}, textContent: '', width: 400, height: 400,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400 }),
      classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x) },
      addEventListener(type, fn) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(fn);
      },
      dispatch(type, event) { for (const fn of listeners.get(type) || []) fn(event); },
      click() { this.onclick?.(); },
    };
    elements.set(id, element);
    return element;
  }
  const context = vm.createContext({
    console,
    window: { devicePixelRatio: 1, addEventListener(type, callback) { events.set(type, callback); }, confirm },
    document: { hidden: false, getElementById: el, querySelectorAll: () => [],
      addEventListener(type, callback) { events.set(type, callback); } },
    localStorage: { getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    requestAnimationFrame() { return 1; }, cancelAnimationFrame() {}, setTimeout: () => 1, clearTimeout() {},
  });
  const modules = new Map();
  const stubs = {
    'native.js': { Native: { init() {}, vibrate() {}, onBack(callback) { nativeEvents.back = callback; }, onStateChange(callback) { nativeEvents.state = callback; }, exit() { exits++; } } },
    'audio.js': { AudioController: class { init() {} move() {} score() {} win() {} pause() {} resume() {} } },
    'renderer.js': { Renderer: class {
      constructor(canvas) { this.canvas = canvas; this.CELL = 40; this.offX = 0; this.offY = 0; this.particles = []; }
      resize() {} spawnParticles() {}
    } },
    'style.css': {},
  };
  function load(filename) {
    if (modules.has(filename)) return modules.get(filename);
    const stub = stubs[path.basename(filename)];
    const mod = stub ? new vm.SyntheticModule(Object.keys(stub), function () {
      for (const [key, value] of Object.entries(stub)) this.setExport(key, value);
    }, { context, identifier: filename }) : new vm.SourceTextModule(fs.readFileSync(filename, 'utf8'), { context, identifier: filename });
    modules.set(filename, mod);
    return mod;
  }
  const main = load(path.resolve(__dirname, '../src/main.js'));
  await main.link((specifier, parent) => load(path.resolve(path.dirname(parent.identifier), specifier)));
  await main.evaluate();
  const game = modules.get(path.resolve(__dirname, '../src/game.js')).namespace.Game;
  if (autoStart) game.start(6, 'pvp', 'normal');
  const move = game.board?.getFreeMoves()[0] || { t: 'h', r: 1, c: 3 };
  const event = {
    isPrimary: true, button: 0, pointerType: 'mouse', preventDefault() {},
    clientX: (move.c + (move.t === 'h' ? 0.5 : 0)) * 40,
    clientY: (move.r + (move.t === 'v' ? 0.5 : 0)) * 40,
  };
  return { game, el, event, storage, events, nativeEvents, context, get exits() { return exits; }, canvas: el('canvas') };
}

for (const pointerType of ['mouse', 'touch', 'pen']) {
  test(`${pointerType}: one gesture produces exactly one move through the application entry point`, async () => {
    const h = await boot();
    let calls = 0;
    const process = h.game.processInput.bind(h.game);
    h.game.processInput = (...args) => { calls++; return process(...args); };
    const event = { ...h.event, pointerType };
    h.canvas.dispatch('pointerdown', event);
    // Compatibility events must neither duplicate input nor call the removed handleInput.
    h.canvas.dispatch('touchstart', { ...event, touches: [event] });
    h.canvas.dispatch('mousedown', event);
    h.canvas.dispatch('click', event);
    assert.equal(calls, 1);
    assert.equal(h.game.historyStack.length, 1);
  });
}

test('secondary touches, right click and middle click cannot place a line', async () => {
  const h = await boot();
  for (const override of [{ isPrimary: false, pointerType: 'touch' }, { button: 1 }, { button: 2 }]) {
    h.canvas.dispatch('pointerdown', { ...h.event, ...override });
  }
  assert.equal(h.game.historyStack.length, 0);
});

test('AI turn, thinking and stopped-game guards still block pointer input', async () => {
  const h = await boot();
  h.game.settings.mode = 'ai';
  h.game.player = 0;
  h.canvas.dispatch('pointerdown', h.event);
  h.game.player = 1;
  h.game.aiThinking = true;
  h.canvas.dispatch('pointerdown', h.event);
  h.game.aiThinking = false;
  h.game.stop();
  h.canvas.dispatch('pointerdown', h.event);
  assert.equal(h.game.historyStack.length, 0);
});

test('restarts do not add extra input handlers', async () => {
  const h = await boot();
  for (let i = 0; i < 5; i++) h.el('restartBtn').click();
  let calls = 0;
  h.game.processInput = () => calls++;
  h.canvas.dispatch('pointerdown', h.event);
  assert.equal(calls, 1);
});

test('menu and Continue retain the game, and a declined new game preserves the save', async () => {
  const h = await boot({ confirm: () => false });
  h.canvas.dispatch('pointerdown', h.event);
  const board = JSON.stringify(h.game.board);
  const raw = h.storage.get('rhombus_save');
  h.el('menuBtn').click();
  assert.equal(h.game.gameOver, true);
  assert.equal(h.el('continueBtn').hidden, false);
  h.el('startBtn').click();
  assert.equal(h.storage.get('rhombus_save'), raw);
  assert.equal(h.game.gameOver, true);
  h.el('continueBtn').click();
  assert.equal(h.game.gameOver, false);
  assert.equal(JSON.stringify(h.game.board), board);
  h.el('restartBtn').click();
  assert.equal(JSON.stringify(h.game.board), board);
});

test('Continue after reload uses saved settings for restart and rematch', async () => {
  const first = await boot();
  first.game.start(8, 'pvp', 'hard');
  first.game.executeMove(first.game.board.getFreeMoves()[0]);
  const h = await boot({ storage: first.storage, autoStart: false });
  assert.equal(h.el('continueBtn').hidden, false);
  h.el('continueBtn').click();
  assert.equal(h.game.settings.size, 8);
  h.el('restartBtn').click();
  assert.equal(h.game.settings.size, 8);
  assert.equal(h.game.settings.mode, 'pvp');
  assert.equal(h.game.settings.diff, 'hard');
  assert.equal(h.game.historyStack.length, 0);
  h.el('againBtn').click();
  assert.equal(h.game.settings.size, 8);
});

test('Back closes help first, then saves to menu, then requests Android exit', async () => {
  const h = await boot();
  h.canvas.dispatch('pointerdown', h.event);
  h.el('help-modal').classList.add('flex');
  h.nativeEvents.back();
  assert.equal(h.el('help-modal').classList.contains('flex'), false);
  assert.equal(h.game.gameOver, false);
  assert.equal(h.exits, 0);
  h.nativeEvents.back();
  assert.equal(h.game.gameOver, true);
  assert.equal(h.el('continueBtn').hidden, false);
  assert.equal(h.exits, 0);
  h.nativeEvents.back();
  assert.equal(h.exits, 1);
});

test('Back closes result without leaving a blocking overlay on the menu', async () => {
  const h = await boot();
  h.el('overlay').classList.add('flex');
  h.nativeEvents.back();
  assert.equal(h.el('overlay').classList.contains('flex'), false);
  assert.equal(h.el('view-game').classList.contains('hidden'), false);
  h.nativeEvents.back();
  assert.equal(h.el('view-game').classList.contains('hidden'), true);
});

test('native, visibility and page events all feed the same pause controller', async () => {
  const h = await boot();
  h.nativeEvents.state({ isActive: false });
  h.context.document.hidden = true;
  h.events.get('visibilitychange')();
  h.events.get('pagehide')();
  h.nativeEvents.state({ isActive: true });
  h.context.document.hidden = false;
  h.events.get('visibilitychange')();
  assert.equal(h.game.paused, true);
  h.events.get('pageshow')();
  assert.equal(h.game.paused, false);
});


test('hover previews a legal line without committing it and clears on leave', async () => {
  const h = await boot();
  const before = JSON.stringify(h.game.board);
  h.canvas.dispatch('pointermove', { ...h.event, buttons: 0 });
  assert.deepEqual(JSON.parse(JSON.stringify(h.game.hoverMove)), h.game.board.getFreeMoves()[0]);
  assert.equal(JSON.stringify(h.game.board), before);
  assert.equal(h.game.historyStack.length, 0);
  h.canvas.dispatch('pointerleave', {});
  assert.equal(h.game.hoverMove, null);
});

test('help tutorial moves between steps without changing match or save', async () => {
  const h = await boot();
  const beforeBoard = JSON.stringify(h.game.board);
  const beforeSave = h.storage.get('rhombus_save');
  h.el('helpBtn').click();
  assert.equal(h.el('tutorial-count').textContent, 'Step 1 of 4');
  h.el('tutorial-next').click();
  assert.equal(h.el('tutorial-count').textContent, 'Step 2 of 4');
  h.el('tutorial-back').click();
  assert.equal(h.el('tutorial-count').textContent, 'Step 1 of 4');
  for (let i = 0; i < 4; i++) h.el('tutorial-next').click();
  assert.equal(h.el('help-modal').classList.contains('flex'), false);
  assert.equal(JSON.stringify(h.game.board), beforeBoard);
  assert.equal(h.storage.get('rhombus_save'), beforeSave);
});
