const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function boot() {
  const elements = new Map();
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
    window: { devicePixelRatio: 1, addEventListener() {} },
    document: { getElementById: el, querySelectorAll: () => [] },
    localStorage: { setItem() {}, removeItem() {} },
    requestAnimationFrame() {}, setTimeout: () => 1, clearTimeout() {},
  });
  const modules = new Map();
  const stubs = {
    'native.js': { Native: { init() {}, vibrate() {}, onBack() {} } },
    'audio.js': { AudioController: class { init() {} move() {} score() {} win() {} } },
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
  game.start(6, 'pvp', 'normal');
  const move = game.board.getFreeMoves()[0];
  const event = {
    isPrimary: true, button: 0, pointerType: 'mouse', preventDefault() {},
    clientX: (move.c + (move.t === 'h' ? 0.5 : 0)) * 40,
    clientY: (move.r + (move.t === 'v' ? 0.5 : 0)) * 40,
  };
  return { game, el, event, canvas: el('canvas') };
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
