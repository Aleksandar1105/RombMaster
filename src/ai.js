import { CONSTANTS } from './constants.js';

// These thresholds count incomplete cells with three sides already drawn.
// Such cells can be captured on the very next move.
function captureOpportunities(board) {
  let count = 0;
  for (let row = 0; row < board.S; row++) {
    for (let col = 0; col < board.S; col++) {
      if (!board.active(row, col) || board.owner[row][col] !== null) continue;
      const edges = Number(board.h[row][col]) + Number(board.h[row + 1][col]) +
        Number(board.v[row][col]) + Number(board.v[row][col + 1]);
      if (edges === 3) count++;
    }
  }
  return count;
}


/* Deep-endgame solver for small remaining boards. Uses exact turn transitions:
   completing a cell keeps the mover's turn. Never mutates the live board. */
function solveSmallEndgame(board, player, maxNodes = 6000) {
  const free = board.getFreeMoves();
  if (!free.length || free.length > 9) return null;
  const cache = new Map();
  let visited = 0, exhausted = false;
  const key = (state, who) =>
    who + ':' + state.score.join(',') + ':' +
    state.h.map(row => row.map(Number).join('')).join('') + ':' +
    state.v.map(row => row.map(Number).join('')).join('');

  const value = (state, who) => {
    const moves = state.getFreeMoves();
    if (!moves.length) return state.score[CONSTANTS.O] - state.score[CONSTANTS.X];
    const k = key(state, who);
    if (cache.has(k)) return cache.get(k);
    if (++visited > maxNodes) { exhausted = true; return 0; }
    let best = who === CONSTANTS.O ? -Infinity : Infinity;
    for (const move of moves) {
      const next = state.clone();
      const made = next.makeMove(move.t, move.r, move.c, who);
      const result = value(next, made.points > 0 ? who : 1 - who);
      if (exhausted) return 0;
      best = who === CONSTANTS.O ? Math.max(best, result) : Math.min(best, result);
    }
    cache.set(k, best);
    return best;
  };

  let chosen = null, top = player === CONSTANTS.O ? -Infinity : Infinity;
  // A deterministic tie-break prefers immediate captures.
  for (const move of free) {
    const next = board.clone();
    const made = next.makeMove(move.t, move.r, move.c, player);
    const score = value(next, made.points > 0 ? player : 1 - player);
    if (exhausted) return null; // fall back rather than claim an exact solution
    if (chosen === null ||
        (player === CONSTANTS.O && score > top) ||
        (player === CONSTANTS.X && score < top)) {
      chosen = move;
      top = score;
    }
  }
  return chosen;
}

/* When forced to open a chain, limit how many cells we hand over.
   This is a bounded approximation, not an assertion of perfect play. */
function immediateCaptureRun(board, player, maxSteps = 20) {
  const copy = board.clone();
  let total = 0;
  for (let step = 0; step < maxSteps; step++) {
    let selected = null, bestPoints = 0;
    for (const move of copy.getFreeMoves()) {
      const simulation = copy.clone();
      const result = simulation.makeMove(move.t, move.r, move.c, player);
      if (result.points > bestPoints) { selected = move; bestPoints = result.points; }
    }
    if (!selected) break;
    copy.makeMove(selected.t, selected.r, selected.c, player);
    total += bestPoints;
  }
  return total;
}

function chooseLeastCostlyOpening(board, ordered) {
  const noCapture = ordered.filter(item => item.points === 0);
  if (!noCapture.length || noCapture.some(item => item.exposed === 0)) return null;
  // The opponent is able to capture immediately from every available opening.
  let winner = null, leastCost = Infinity;
  for (const item of noCapture) {
    const cost = immediateCaptureRun(item.next, CONSTANTS.X);
    if (cost < leastCost) { leastCost = cost; winner = item; }
  }
  return winner?.move || null;
}

function shuffle(items, random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1))));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function candidates(board, player, random) {
  const threatsBefore = captureOpportunities(board);
  return shuffle(board.getFreeMoves(), random).map(move => {
    const next = board.clone();
    const result = next.makeMove(move.t, move.r, move.c, player);
    const threatsAfter = captureOpportunities(next);
    // Penalize handing an immediately capturable square to the opponent.
    const exposed = result.points ? 0 : Math.max(0, threatsAfter - threatsBefore);
    return {
      move, next, points: result.points, exposed,
      nextPlayer: result.points ? player : 1 - player,
      priority: result.points * 1000 - exposed * 250 - (result.points ? 0 : threatsAfter * 5),
    };
  });
}

function evaluation(board, toMove) {
  const score = board.score[CONSTANTS.O] - board.score[CONSTANTS.X];
  if (board.isGameOver()) return score * 10000;
  const capturable = captureOpportunities(board);
  // A three-sided square usually benefits the player whose turn is next.
  return score * 100 + (toMove === CONSTANTS.O ? 1 : -1) * capturable * 36;
}

function search(board, player, depth, alpha, beta, budget, random) {
  if (depth === 0 || board.isGameOver() || budget.nodes >= budget.limit) {
    return evaluation(board, player);
  }
  budget.nodes++;
  const ordered = candidates(board, player, random)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, budget.branchLimit);
  if (!ordered.length) return evaluation(board, player);
  const maximizing = player === CONSTANTS.O;
  let best = maximizing ? -Infinity : Infinity;
  for (const candidate of ordered) {
    const value = search(candidate.next, candidate.nextPlayer, depth - 1,
      alpha, beta, budget, random);
    best = maximizing ? Math.max(best, value) : Math.min(best, value);
    if (maximizing) alpha = Math.max(alpha, best);
    else beta = Math.min(beta, best);
    if (alpha >= beta) break;
  }
  return best;
}

export function aiStrength(difficulty, careerLevel = null) {
  if (!['easy', 'normal', 'hard'].includes(difficulty)) throw new Error('Invalid AI difficulty');
  if (careerLevel === null || careerLevel === undefined) {
    return {
      captureChance: difficulty === 'easy' ? 0 : 1,
      safeChance: difficulty === 'hard' ? 1 : 0,
      depth: difficulty === 'hard' ? 2 : 0,
    };
  }
  if (!Number.isInteger(careerLevel) || careerLevel < 1 || careerLevel > 30) {
    throw new Error('Invalid career AI level');
  }
  const expected = careerLevel <= 10 ? 'easy' : careerLevel <= 20 ? 'normal' : 'hard';
  if (expected !== difficulty) throw new Error('Career AI tier mismatch');
  if (careerLevel <= 10) {
    return { captureChance: 0.15 + (careerLevel - 1) * 0.08, safeChance: 0, depth: 0 };
  }
  if (careerLevel <= 20) {
    return { captureChance: 1, safeChance: 0.25 + (careerLevel - 11) * 0.08, depth: 0 };
  }
  return {
    captureChance: 1,
    safeChance: 1,
    depth: careerLevel < 24 ? 1 : careerLevel < 28 ? 2 : 3,
  };
}

export const AI = {
  getBestMove(board, difficulty, careerLevel = null, random = Math.random) {
    const moves = board.getFreeMoves();
    if (!moves.length) return null;
    const strength = aiStrength(difficulty, careerLevel);
    // Advanced opponents can calculate exact outcomes near the end rather than
    // automatically taking an attractive but strategically losing chain.
    if (difficulty === 'hard' && strength.depth >= 2 && moves.length <= 9) {
      const endgame = solveSmallEndgame(board, CONSTANTS.O);
      if (endgame) return endgame;
    }
    if (difficulty === 'easy') {
      // Gentle, increasingly opportunistic AI for the early career stages.
      if (random() < strength.captureChance) {
        const scored = candidates(board, CONSTANTS.O, random)
          .filter(candidate => candidate.points > 0)
          .sort((a, b) => b.points - a.points);
        if (scored.length) return scored[0].move;
      }
      return moves[Math.min(moves.length - 1, Math.floor(random() * moves.length))];
    }

    const ordered = candidates(board, CONSTANTS.O, random)
      .sort((a, b) => b.priority - a.priority);
    const bestCapture = ordered[0];
    // Extra moves from captured squares are usually strongest. Preserve this
    // rule even at low search depths so the computer cannot throw away points.
    if (bestCapture.points > 0) return bestCapture.move;

    // Once all safe lines are gone, sacrifice the smallest available chain
    // rather than picking a random edge with no strategic understanding.
    if (strength.safeChance > 0 && ordered.every(item => item.exposed > 0)) {
      const smallestSacrifice = chooseLeastCostlyOpening(board, ordered);
      if (smallestSacrifice) return smallestSacrifice;
    }

    if (random() >= strength.safeChance) {
      return moves[Math.min(moves.length - 1, Math.floor(random() * moves.length))];
    }
    if (strength.depth === 0) return ordered[0].move;
    if (strength.depth === 1) return ordered[0].move;

    // Bounded lookahead with extra-turn-aware turn transitions. Fixed node
    // budget avoids pathological pauses on larger boards and older phones.
    const budget = { nodes: 0, limit: 180, branchLimit: 5 };
    let best = ordered[0];
    let bestValue = -Infinity;
    for (const candidate of ordered.slice(0, 6)) {
      const value = search(candidate.next, candidate.nextPlayer,
        strength.depth - 1, -Infinity, Infinity, budget, random);
      if (value > bestValue) {
        best = candidate;
        bestValue = value;
      }
    }
    return best.move;
  },
};
