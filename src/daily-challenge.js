import { Board } from './board.js';
import { CONSTANTS } from './constants.js';

export const DAILY_TYPES = Object.freeze(['capture', 'safe', 'double']);
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
  const board = new Board(4);
  const seed = hash(key + ':capture');
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

export function createDailyPuzzle(dateKey, index) {
  if (!validDateKey(dateKey) || !Number.isInteger(index) || index < 0 || index >= 3) {
    throw new Error('Invalid daily challenge');
  }
  return [createCapture, createSafe, createDouble][index](dateKey);
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
  return { correct, reason: correct ? 'solved' : 'retry', points: result.points };
}
