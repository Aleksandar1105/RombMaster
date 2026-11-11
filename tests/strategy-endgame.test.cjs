
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
async function load() {
  const context = vm.createContext({ Math, Map, Number, Infinity });
  const modules = new Map();
  const get = file => {
    if (!modules.has(file)) modules.set(file, new vm.SourceTextModule(fs.readFileSync(
      path.resolve(__dirname, '../src', file), 'utf8'), { context, identifier:file }));
    return modules.get(file);
  };
  const entry = get('ai.js');
  await entry.link(specifier => get(path.basename(specifier)));
  await entry.evaluate();
  return { AI:entry.namespace.AI, Board:get('board.js').namespace.Board };
}
test('hard AI returns a legal move and does not modify the board in tactical positions', async () => {
  const { AI, Board } = await load();
  for (const size of [4, 6, 8]) {
    const board = new Board(size);
    for (let step=0;step<15;step++) {
      const moves=board.getFreeMoves();
      if(!moves.length) break;
      const move=moves[(step*3+5)%moves.length];
      board.makeMove(move.t,move.r,move.c,step%2);
    }
    const snapshot=JSON.stringify({ h:board.h, v:board.v, owner:board.owner, score:board.score });
    const move=AI.getBestMove(board,'hard',null,()=>0.29);
    assert.ok(board.getFreeMoves().some(candidate => JSON.stringify(candidate) === JSON.stringify(move)));
    assert.equal(JSON.stringify({ h:board.h, v:board.v, owner:board.owner, score:board.score }),snapshot);
  }
});
test('hard endgame is reproducible with a deterministic tie break', async () => {
  const { AI, Board } = await load();
  const board=new Board(4);
  while(board.getFreeMoves().length>7) {
    const moves=board.getFreeMoves();
    const move=moves[(moves.length*3+2)%moves.length];
    board.makeMove(move.t,move.r,move.c,0);
  }
  const a=AI.getBestMove(board,'hard',null,()=>0.31);
  const b=AI.getBestMove(board,'hard',null,()=>0.31);
  assert.equal(JSON.stringify(a),JSON.stringify(b));
});
