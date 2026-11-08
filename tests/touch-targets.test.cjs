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
  return module.namespace.nearestLegalLine;
}

function board(moves) {
  return { getFreeMoves: () => moves };
}

test('hits the midpoint of a legal horizontal or vertical line', async () => {
  const pick = await load();
  const moves = [{ t: 'h', r: 1, c: 2 }, { t: 'v', r: 2, c: 3 }];
  assert.equal(pick(board(moves), 40, 0, 0, 100, 40)?.t, 'h');
  assert.equal(pick(board(moves), 40, 0, 0, 120, 100)?.t, 'v');
});

test('rejects distant touch and coordinates far outside the board', async () => {
  const pick = await load();
  const moves = [{ t: 'h', r: 1, c: 2 }];
  assert.equal(pick(board(moves), 40, 0, 0, 300, 300), null);
  assert.equal(pick(board(moves), 40, 0, 0, -100, -100), null);
  assert.equal(pick(board(moves), 0, 0, 0, 100, 40), null);
  assert.equal(pick(board(moves), 40, 0, 0, NaN, 40), null);
});

test('does not snap taps equally close to two available lines', async () => {
  const pick = await load();
  const moves = [{ t: 'h', r: 1, c: 1 }, { t: 'h', r: 2, c: 1 }];
  assert.equal(pick(board(moves), 40, 0, 0, 60, 60), null);
});

test('never suggests a played line, even when tapped at its old midpoint', async () => {
  const pick = await load();
  const moves = [{ t: 'v', r: 4, c: 4 }];
  assert.equal(pick(board(moves), 40, 0, 0, 100, 40), null);
});
