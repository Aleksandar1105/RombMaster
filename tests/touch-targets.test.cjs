const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function load() {
  const context = vm.createContext({});
  const module = new vm.SourceTextModule(
    fs.readFileSync(path.resolve(__dirname, '../src/input.js'), 'utf8'), { context }
  );
  await module.link(() => { throw new Error('input.js should have no imports'); });
  await module.evaluate();
  return { nearestLegalLine: module.namespace.nearestLegalLine, canvasPoint: module.namespace.canvasPoint };
}

function board(moves) {
  return { getFreeMoves: () => moves };
}

test('hits the midpoint of a legal horizontal or vertical line', async () => {
  const { nearestLegalLine: pick } = await load();
  const moves = [{ t: 'h', r: 1, c: 2 }, { t: 'v', r: 2, c: 3 }];
  assert.equal(pick(board(moves), 40, 0, 0, 100, 40)?.t, 'h');
  assert.equal(pick(board(moves), 40, 0, 0, 120, 100)?.t, 'v');
});

test('rejects distant touch and coordinates far outside the board', async () => {
  const { nearestLegalLine: pick } = await load();
  const moves = [{ t: 'h', r: 1, c: 2 }];
  assert.equal(pick(board(moves), 40, 0, 0, 300, 300), null);
  assert.equal(pick(board(moves), 40, 0, 0, -100, -100), null);
  assert.equal(pick(board(moves), 0, 0, 0, 100, 40), null);
  assert.equal(pick(board(moves), 40, 0, 0, NaN, 40), null);
});

test('does not snap taps equally close to two available lines', async () => {
  const { nearestLegalLine: pick } = await load();
  const moves = [{ t: 'h', r: 1, c: 1 }, { t: 'h', r: 2, c: 1 }];
  assert.equal(pick(board(moves), 40, 0, 0, 60, 60), null);
});

test('never suggests a played line, even when tapped at its old midpoint', async () => {
  const { nearestLegalLine: pick } = await load();
  const moves = [{ t: 'v', r: 4, c: 4 }];
  assert.equal(pick(board(moves), 40, 0, 0, 100, 40), null);
});


test('logical pointer coordinates stay correct at devicePixelRatio 3 and with CSS scaling', async () => {
  const { canvasPoint } = await load();
  const canvas = {
    width: 360 * 3,
    height: 360 * 3,
    style: { width: '360px', height: '360px' },
    getBoundingClientRect() {
      return { left: 25, top: 40, width: 300, height: 300 };
    },
  };
  const point = canvasPoint(canvas, 25 + 150, 40 + 75);
  assert.equal(point.x, 180);
  assert.equal(point.y, 90);
  // The backing store resolution is deliberately not used as a coordinate system.
  assert.notEqual(point.x, canvas.width / 2);
});

test('logical pointer rejects invalid rectangles, coordinates and collapsed canvases', async () => {
  const { canvasPoint } = await load();
  assert.equal(canvasPoint(null, 0, 0), null);
  assert.equal(canvasPoint({ getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 100 }) }, 10, 10), null);
  assert.equal(canvasPoint({ getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) }, NaN, 10), null);
  const canvas = { style: {}, getBoundingClientRect: () => ({ left: 20, top: 20, width: 80, height: 80 }) };
  assert.equal(canvasPoint(canvas, 60, 60).x, 40);
});
