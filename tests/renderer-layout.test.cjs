const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function createRenderer({ width, height, dpr = 1, parts = {} }) {
  const ctx = {
    setTransform() {},
    scale() {},
  };
  const canvas = {
    style: {},
    width: 0,
    height: 0,
    getContext() { return ctx; },
  };
  const context = vm.createContext({
    window: { innerWidth: width, innerHeight: height, devicePixelRatio: dpr },
  });
  const constants = new vm.SyntheticModule(['CONSTANTS'], function () {
    this.setExport('CONSTANTS', { COLORS: {} });
  }, { context });
  const module = new vm.SourceTextModule(
    fs.readFileSync(path.resolve(__dirname, '../src/renderer.js'), 'utf8'),
    { context }
  );
  await module.link(() => constants);
  await module.evaluate();
  const Renderer = module.namespace.Renderer;
  const renderer = new Renderer(canvas);
  const view = {
    clientWidth: width,
    clientHeight: height,
    querySelector(selector) {
      return { getBoundingClientRect: () => ({ height: parts[selector] || 0 }) };
    },
  };
  return { renderer, canvas, view };
}

test('phone layout reserves space for HUD instead of using a fixed canvas height', async () => {
  const h = await createRenderer({
    width: 360, height: 640,
    parts: { '#scoreboard': 70, '#turn-status': 54, '#controls': 60 },
  });
  h.renderer.resize(h.view, 7);
  assert.ok(Number.parseInt(h.canvas.style.width, 10) <= 360 - 48);
  assert.ok(Number.parseInt(h.canvas.style.height, 10) <= 640 - 70 - 54 - 60 - 100);
  assert.ok(h.renderer.CELL > 0);
});

test('short landscape remains positive and scrollable, with capped device pixel ratio', async () => {
  const h = await createRenderer({ width: 680, height: 250, dpr: 4,
    parts: { '#scoreboard': 48, '#turn-status': 40, '#controls': 44 } });
  h.renderer.resize(h.view, 9);
  assert.ok(Number.parseInt(h.canvas.style.width, 10) >= 120);
  assert.equal(h.canvas.width, Number.parseInt(h.canvas.style.width, 10) * 3);
  assert.ok(h.renderer.CELL > 0);
});

test('larger screens cap excessive board size', async () => {
  const h = await createRenderer({ width: 1200, height: 1000, dpr: 2 });
  h.renderer.resize(h.view, 7);
  assert.equal(h.canvas.style.width, '520px');
  assert.equal(h.canvas.width, 1040);
});
