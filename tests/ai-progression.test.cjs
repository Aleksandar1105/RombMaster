const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function loadAI() {
  const context = vm.createContext({ Math });
  const modules = new Map();
  function load(filename) {
    if (modules.has(filename)) return modules.get(filename);
    const module = new vm.SourceTextModule(
      fs.readFileSync(path.resolve(__dirname, '../src', filename), 'utf8'),
      { context, identifier: filename }
    );
    modules.set(filename, module);
    return module;
  }
  const entry = load('ai.js');
  await entry.link((specifier) => load(path.basename(specifier)));
  await entry.evaluate();
  return {
    AI: entry.namespace.AI,
    aiStrength: entry.namespace.aiStrength,
    Board: modules.get('board.js')?.namespace.Board || (await (async () => {
      const boardModule = load('board.js');
      if (boardModule.status === 'unlinked') {
        await boardModule.link((specifier) => load(path.basename(specifier)));
      }
      if (boardModule.status !== 'evaluated') await boardModule.evaluate();
      return boardModule.namespace.Board;
    })()),
  };
}

test('Career intelligence increases within each board tier', async () => {
  const { aiStrength } = await loadAI();
  assert.ok(aiStrength('easy', 1).captureChance < aiStrength('easy', 10).captureChance);
  assert.ok(aiStrength('normal', 11).safeChance < aiStrength('normal', 20).safeChance);
  assert.equal(aiStrength('hard', 21).depth, 1);
  assert.equal(aiStrength('hard', 26).depth, 2);
  assert.equal(aiStrength('hard', 30).depth, 3);
  assert.throws(() => aiStrength('hard', 3));
  assert.throws(() => aiStrength('normal', 31));
});

test('All level boundaries return a legal move on their matching board', async () => {
  const { AI, Board } = await loadAI();
  for (const [level, size, difficulty] of [
    [1, 4, 'easy'], [10, 4, 'easy'], [11, 6, 'normal'],
    [20, 6, 'normal'], [21, 8, 'hard'], [30, 8, 'hard'],
  ]) {
    const board = new Board(size);
    const move = AI.getBestMove(board, difficulty, level, () => 0.42);
    assert.ok(board.getFreeMoves().some(m => JSON.stringify(m) === JSON.stringify(move)),
      `Level ${level} returned an illegal move`);
  }
});

test('AI returns no move for a finished game', async () => {
  const { AI, Board } = await loadAI();
  const board = new Board(4);
  for (const move of board.getFreeMoves()) board.makeMove(move.t, move.r, move.c, 0);
  assert.equal(AI.getBestMove(board, 'hard', 30), null);
});

test('AI prioritizes an available immediate capture on normal/hard', async () => {
  const { AI, Board } = await loadAI();
  const board = new Board(4);
  let captureAvailable = false;
  for (const move of board.getFreeMoves()) {
    const b = board.clone();
    const r = b.makeMove(move.t, move.r, move.c, 0);
    if (r.points > 0) { captureAvailable = true; break; }
    board.makeMove(move.t, move.r, move.c, 1);
    captureAvailable = board.getFreeMoves().some(m => {
      const temp = board.clone();
      return temp.makeMove(m.t, m.r, m.c, 0).points > 0;
    });
    if (captureAvailable) break;
  }
  assert.ok(captureAvailable);
  for (const [difficulty, level] of [['normal', 15], ['hard', 30]]) {
    const move = AI.getBestMove(board, difficulty, level, () => 0.1);
    const next = board.clone();
    assert.ok(next.makeMove(move.t, move.r, move.c, 0).points > 0,
      `${difficulty} ignored an immediate score`);
  }
});
