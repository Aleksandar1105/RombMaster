import { missionFor, startingBoard } from './career-missions.js';
import { Board } from './board.js';
import { CONSTANTS } from './constants.js';
import { careerLevel, LocalSlots } from './profile.js';

export const SAVE_KEY = 'rhombus_save';

function settingsOf(value) {
  if (!value || ![4, 6, 8, 10].includes(value.size) ||
      !['ai', 'pvp'].includes(value.mode) ||
      !['easy', 'normal', 'hard'].includes(value.diff)) throw new Error('Invalid settings');
  const settings = { size: value.size, mode: value.mode, diff: value.diff };
  if (value.careerLevel !== undefined) {
    const config = careerLevel(value.careerLevel);
    if (settings.mode !== 'ai' || settings.size !== config.size || settings.diff !== config.diff) {
      throw new Error('Career level does not match saved game settings');
    }
    settings.careerLevel = config.level;
  }
  if (value.openingVersion !== undefined) {
    if (value.openingVersion !== 1 || !missionFor(settings.careerLevel)) throw Error('Unknown Career opening');
    settings.openingVersion = 1;
  }
  return settings;
}

function sameBoard(actual, expected) {
  return actual && ['R', 'S', 'C', 'D', 'h', 'v', 'owner', 'score'].every(key =>
    JSON.stringify(actual[key]) === JSON.stringify(expected[key]));
}

function replay(settings, moves) {
  const board = startingBoard(settings);
  if (!Array.isArray(moves) || moves.length > board.getFreeMoves().length) throw new Error('Invalid move count');
  let player = CONSTANTS.X, lastMove = null;
  const history = [], cleanMoves = [];
  for (const move of moves) {
    const legal = move && board.getFreeMoves().find(m =>
      m.t === move.t && m.r === move.r && m.c === move.c);
    if (!legal) throw new Error('Invalid move');
    history.push({ boardState: board.clone(), player, score: [...board.score], lastMove });
    const result = board.makeMove(legal.t, legal.r, legal.c, player);
    if (!result.points) player = 1 - player;
    lastMove = legal;
    cleanMoves.push(legal);
  }
  return { board, player, lastMove, history, moves: cleanMoves, settings };
}

// Migrate old snapshot saves only if every board and turn can be reproduced
// from legal moves. Never attach untrusted JSON to a Board prototype.
function migrateLegacy(data, settings) {
  const board = new Board(settings.size);
  // Historical snapshots counted the two starting cells per player.
  // Validate them under their original rules, then replay earned points.
  board.score = [2, 2];
  if (!Array.isArray(data.history) || data.history.length > board.getFreeMoves().length) throw new Error('Invalid history');
  let player = CONSTANTS.X;
  const moves = [];
  for (let i = 0; i < data.history.length; i++) {
    const snapshot = data.history[i];
    if (!snapshot || !sameBoard(snapshot.boardState, board) || snapshot.player !== player ||
        JSON.stringify(snapshot.score) !== JSON.stringify(board.score)) throw new Error('Invalid snapshot');
    const next = data.history[i + 1]?.boardState ?? data.board;
    const added = board.getFreeMoves().filter(m => next?.[m.t]?.[m.r]?.[m.c] === true);
    if (added.length !== 1) throw new Error('Invalid transition');
    const move = added[0];
    const result = board.makeMove(move.t, move.r, move.c, player);
    if (!result.points) player = 1 - player;
    moves.push(move);
  }
  if (!sameBoard(data.board, board) || data.player !== player) throw new Error('Invalid final board');
  return replay(settings, moves);
}

export function decodeSave(raw) {
  if (typeof raw !== 'string' || raw.length > 2_000_000) throw new Error('Invalid save size');
  const data = JSON.parse(raw);
  if (!data || typeof data !== 'object') throw new Error('Invalid save');
  const settings = settingsOf(data.settings);
  if (data.version === undefined) return { ...migrateLegacy(data, settings), careerUndosUsed: 0 };
  if (data.version !== 1) throw new Error('Unsupported save version');
  const careerUndosUsed = data.careerUndosUsed === undefined ? 0 : data.careerUndosUsed;
  if (!Number.isInteger(careerUndosUsed) || careerUndosUsed < 0 ||
      careerUndosUsed > (settings.careerLevel ? 1 : 0)) {
    throw new Error('Invalid Undo count');
  }
  return { ...replay(settings, data.moves), careerUndosUsed };
}

export const SaveStore = {
  read() {
    let raw;
    try { raw = localStorage.getItem(LocalSlots.storageKey(SAVE_KEY) ?? (() => { throw Error('Slots unavailable'); })()); }
    catch { return { status: 'unavailable' }; }
    if (raw === null) return { status: 'empty' };
    try {
      const state = decodeSave(raw);
      return { status: state.board.isGameOver() ? 'finished' : 'ready', state };
    } catch {
      // Preserve invalid/unsupported data until the player chooses a new game.
      return { status: 'invalid' };
    }
  },
  write(settings, moves, careerUndosUsed = 0) {
    if (!Number.isInteger(careerUndosUsed) || careerUndosUsed < 0 ||
        careerUndosUsed > (settings?.careerLevel ? 1 : 0)) return false;
    try {
      const data = { version: 1, settings, moves };
      if (settings.careerLevel) data.careerUndosUsed = careerUndosUsed;
      localStorage.setItem(LocalSlots.storageKey(SAVE_KEY) ?? (() => { throw Error('Slots unavailable'); })(), JSON.stringify(data));
      return true;
    } catch { return false; }
  },
  clear() {
    try { localStorage.removeItem(LocalSlots.storageKey(SAVE_KEY) ?? (() => { throw Error('Slots unavailable'); })()); return true; }
    catch { return false; }
  },
};
