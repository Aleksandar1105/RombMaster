import { Board } from './board.js';
import { CONSTANTS } from './constants.js';

export const DAILY_TYPES = Object.freeze(['capture', 'safe', 'double', 'chain', 'duel']);
export const DAILY_XP_REWARD = 30;

// Date is local to the device. This is an offline practice activity, never a
// verified online leaderboard or a medical "brain age" measurement.
export function localDateKey(date = new Date()) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
    throw new Error('Invalid date');
  }
  const y = String(date.getFullYear()).padStart(4, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function validDateKey(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const date = new Date(key + 'T00:00:00.000Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === key;
}

function hash(seed) {
  let value = 2166136261;
  for (const char of seed) {
    value ^= char.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function rotatePick(items, value) {
  if (!items.length) throw new Error('No suitable puzzle layout');
  return items[value % items.length];
}

function edges(r, c) {
  return [
    { t: 'h', r, c }, { t: 'h', r: r + 1, c },
    { t: 'v', r, c }, { t: 'v', r, c: c + 1 },
  ];
}

function sameMove(a, b) {
  return a.t === b.t && a.r === b.r && a.c === b.c;
}

function cellCandidates(board) {
  const free = board.getFreeMoves();
  const cells = [];
  for (let r = 0; r < board.S; r++) for (let c = 0; c < board.S; c++) {
    if (!board.active(r, c) || board.owner[r][c] != null) continue;
    const freeEdges = edges(r, c).filter(edge => free.some(m => sameMove(m, edge)));
    if (freeEdges.length === 4) cells.push({ r, c, freeEdges });
  }
  return cells;
}

function isSafe(board, move) {
  const next = board.clone();
  const result = next.makeMove(move.t, move.r, move.c, CONSTANTS.X);
  if (!result || result.points !== 0) return false;
  return !next.getFreeMoves().some(reply => {
    const response = next.clone().makeMove(reply.t, reply.r, reply.c, CONSTANTS.O);
    return response?.points > 0;
  });
}

function createCapture(key) {
  const seed = hash(key + ':capture');
  const board = new Board(seed % 3 ? 6 : 4);
  const cell = rotatePick(cellCandidates(board), seed);
  const skip = seed % 4;
  cell.freeEdges.forEach((edge, i) => {
    if (i !== skip) board.makeMove(edge.t, edge.r, edge.c, CONSTANTS.O);
  });
  return {
    type: 'capture', board, title: 'Find the Capture',
    instruction: 'Tap a line that completes a square and scores a point.',
    success: 'Great spot! Closing the fourth side earns a point.',
    retry: 'Look for a square with exactly three sides.',
  };
}

function createSafe(key) {
  const board = new Board(6);
  const seed = hash(key + ':safe');
  // Some geometric positions have only safe or only risky answers.
  // Search a deterministic rotating sequence until the exercise offers both.
  const cells = cellCandidates(board);
  let selectedBoard = null;
  for (let offset = 0; offset < cells.length * 4; offset++) {
    const candidate = cells[(seed + Math.floor(offset / 4)) % cells.length];
    const pairIndex = (seed + offset) % 4;
    const attempt = board.clone();
    for (const edge of [candidate.freeEdges[pairIndex],
      candidate.freeEdges[(pairIndex + 1) % 4]]) {
      attempt.makeMove(edge.t, edge.r, edge.c, CONSTANTS.O);
    }
    const moves = attempt.getFreeMoves();
    if (moves.some(m => isSafe(attempt, m)) &&
        moves.some(m => !isSafe(attempt, m))) {
      selectedBoard = attempt;
      break;
    }
  }
  if (!selectedBoard) throw new Error('No meaningful safe-move position');
  return {
    type: 'safe', board: selectedBoard, title: 'Play It Safe',
    instruction: 'Choose a line that does not give the other player an immediate capture.',
    success: 'Smart defense! That move leaves no easy square for your opponent.',
    retry: 'Check which squares would have three sides after your move.',
  };
}

function createDouble(key) {
  const board = new Board(8);
  const options = [];
  const free = board.getFreeMoves();
  for (let r = 0; r < board.S; r++) for (let c = 0; c < board.S; c++) {
    if (!board.active(r, c) || board.owner[r][c] != null) continue;
    for (const [nr, nc, shared] of [
      [r, c + 1, { t: 'v', r, c: c + 1 }],
      [r + 1, c, { t: 'h', r: r + 1, c }],
    ]) {
      if (nr >= board.S || nc >= board.S || !board.active(nr, nc) ||
          board.owner[nr][nc] != null || !free.some(m => sameMove(m, shared))) continue;
      options.push({ r, c, nr, nc, shared });
    }
  }
  const selected = rotatePick(options, hash(key + ':double'));
  for (const edge of [...edges(selected.r, selected.c), ...edges(selected.nr, selected.nc)]) {
    if (sameMove(edge, selected.shared)) continue;
    if (board.getFreeMoves().some(m => sameMove(m, edge))) {
      board.makeMove(edge.t, edge.r, edge.c, CONSTANTS.O);
    }
  }
  const winning = board.clone().makeMove(selected.shared.t, selected.shared.r,
    selected.shared.c, CONSTANTS.X);
  if (!winning || winning.points < 2) throw new Error('Double-capture puzzle cannot be solved');
  return {
    type: 'double', board, title: 'Double Capture',
    instruction: 'Find one line that captures at least two squares.',
    success: 'Excellent! One clever line captures two squares.',
    retry: 'Look between two nearly completed neighboring squares.',
  };
}

// Solve only the remaining edges. A scoring move keeps the same player.
function endgame(board) {
  const moves = board.getFreeMoves();
  const cells = [];
  for (let r = 0; r < board.S; r++) for (let c = 0; c < board.S; c++) {
    if (!board.active(r, c) || board.owner[r][c] != null) continue;
    const sides = edges(r, c);
    const mask = moves.reduce((bits, m, i) =>
      sides.some(side => sameMove(m, side)) ? bits | (1 << i) : bits, 0);
    if (mask) cells.push(mask);
  }
  const memo = new Map([[0, 0]]);
  function value(left) {
    if (memo.has(left)) return memo.get(left);
    let best = -Infinity;
    for (let bit = 1; bit <= left; bit *= 2) {
      if (left & bit) best = Math.max(best, outcome(left, bit));
    }
    memo.set(left, best);
    return best;
  }
  function outcome(left, bit) {
    const points = cells.filter(mask => (mask & left) === bit).length;
    const rest = value(left ^ bit);
    return points ? points + rest : -rest;
  }
  const all = (1 << moves.length) - 1;
  return moves.map((move, i) => ({ move, margin: outcome(all, 1 << i) }));
}

export function duelReply(board) {
  const choices = endgame(board);
  return choices.reduce((best, item) => !best || item.margin > best.margin ? item : best, null)?.move;
}

function shuffled(items, random) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function randomFor(seed) {
  let n = hash(seed);
  return () => {
    n = (Math.imul(1664525, n) + 1013904223) >>> 0;
    return n / 4294967296;
  };
}

function createDuel(key, difficulty) {
  const random = randomFor(key + ':duel');
  const remaining = difficulty === 'Expert' ? 9 : 7;
  // Prefer a position with both winning and losing openings. Always keep
  // a proven winnable fallback from a known small-board position.
  function analyse(board) {
    const choices = endgame(board);
    if (!choices.some(item => item.margin > 0) || !choices.some(item => item.margin <= 0)) return null;
    board.score = [0, 0];
    return { type: 'duel', title: 'Endgame Duel', instruction:
      'Play to the finish against the computer. Only new captures count. Win the remaining squares.',
      board, difficulty, success: 'You won the endgame!', retry: 'Try another opening.' };
  }
  for (let attempt = 0; attempt < 24; attempt++) {
    const board = new Board(random() < 0.5 ? 4 : 6);
    const moves = shuffled(board.getFreeMoves(), random);
    let player = CONSTANTS.X;
    for (const { t, r, c } of moves.slice(remaining)) {
      if (!board.makeMove(t, r, c, player).points) player = 1 - player;
    }
    const duel = analyse(board);
    if (duel) return duel;
  }
  const board = new Board(4);
  for (const [t,r,c] of [['h',2,1], ['h',2,2], ['v',1,3]]) board.makeMove(t,r,c,CONSTANTS.O);
  return analyse(board);
}

function createChain(key) {
  const board = new Board(6);
  const random = randomFor(key + ':chain');
  const options = [];
  for (const {r,c} of cellCandidates(board)) {
    for (const [dr,dc] of [[1,0],[0,1]]) {
      if (board.active(r+2*dr,c+2*dc) && board.owner[r+2*dr][c+2*dc] == null)
        options.push({r,c,dr,dc});
    }
  }
  const {r,c,dr,dc} = shuffled(options, random)[0];
  const first = dr ? {t:'h',r:r+1,c} : {t:'v',r,c:c+1};
  const second = dr ? {t:'h',r:r+2,c} : {t:'v',r,c:c+2};
  for (let i=0;i<3;i++) for (const edge of edges(r+i*dr,c+i*dc)) {
    if (!sameMove(edge,first) && !sameMove(edge,second))
      board.makeMove(edge.t,edge.r,edge.c,CONSTANTS.O);
  }
  return { type: 'chain', board, title: 'Chain Reaction',
    instruction: 'Find a capture that lets you take at least three squares in two moves.',
    success: 'That opening leads to a three-square chain.', retry: 'Look for connected squares with a shared side.' };
}

export function createDailyPuzzle(dateKey, index, practice = 0) {
  if (!validDateKey(dateKey) || !Number.isInteger(index) || index < 0 || index >= 3 ||
      !Number.isSafeInteger(practice) || practice < 0) throw Error('Invalid daily challenge');
  const day = Math.floor(Date.parse(dateKey + 'T00:00:00Z') / 86400000);
  const rotation = day + practice;
  const key = dateKey + ':' + practice + ':' + index;
  if (index === 2) return createDuel(key, rotation % 3 === 0 ? 'Expert' : 'Hard');
  const make = index === 0 ? [createCapture, createSafe][Math.abs(rotation % 2)] :
    [createDouble, createChain][Math.abs(Math.floor(rotation / 2) % 2)];
  const puzzle = make(key);
  // Add legal, non-scoring background lines while preserving at least one
  // solution and one distractor. The opening now varies beyond one target cell.
  const random = randomFor(key);
  const count = 2 + Math.floor(random() * 5);
  for (const m of shuffled(puzzle.board.getFreeMoves(), random).slice(0, count)) {
    const trial = puzzle.board.clone();
    if (trial.makeMove(m.t,m.r,m.c,CONSTANTS.O).points) continue;
    const candidate = { ...puzzle, board: trial };
    const legal = trial.getFreeMoves();
    if (legal.some(move => evaluateDailyMove(candidate,move).correct) &&
        legal.some(move => !evaluateDailyMove(candidate,move).correct)) puzzle.board = trial;
  }
  return { ...puzzle, difficulty: index === 0 ? 'Warm-up' : 'Tactical' };
}

export function evaluateDailyMove(puzzle, move) {
  if (!puzzle || !DAILY_TYPES.includes(puzzle.type) || !puzzle.board ||
      !move || !puzzle.board.getFreeMoves().some(m => sameMove(m, move))) {
    return { correct: false, reason: 'invalid' };
  }
  const test = puzzle.board.clone();
  const result = test.makeMove(move.t, move.r, move.c, CONSTANTS.X);
  let correct = false;
  if (puzzle.type === 'capture') correct = result.points >= 1;
  if (puzzle.type === 'double') correct = result.points >= 2;
  if (puzzle.type === 'safe') correct = isSafe(puzzle.board, move);
  if (puzzle.type === 'chain' && result.points) correct = test.getFreeMoves().some(reply =>
    result.points + test.clone().makeMove(reply.t,reply.r,reply.c,CONSTANTS.X).points >= 3);
  if (puzzle.type === 'duel') correct = endgame(puzzle.board).some(item => sameMove(item.move,move) && item.margin > 0);
  return { correct, reason: correct ? 'solved' : 'retry', points: result.points };
}
