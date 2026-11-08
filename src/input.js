// Convert a touch/cursor location in CSS-canvas coordinates to a single
// unplayed line. Never snap a far-away touch across the board.
export function nearestLegalLine(board, cell, offX, offY, x, y) {
  if (!board || !Number.isFinite(cell) || cell <= 0 ||
      ![offX, offY, x, y].every(Number.isFinite)) return null;
  const free = board.getFreeMoves();
  const reach = Math.min(24, Math.max(10, cell * 0.49));
  let nearest = null, best = Infinity, runnerUp = Infinity;
  for (const move of free) {
    const mx = offX + (move.c + (move.t === 'h' ? 0.5 : 0)) * cell;
    const my = offY + (move.r + (move.t === 'v' ? 0.5 : 0)) * cell;
    const distance = Math.hypot(x - mx, y - my);
    if (distance < best) {
      runnerUp = best;
      best = distance;
      nearest = move;
    } else if (distance < runnerUp) {
      runnerUp = distance;
    }
  }
  if (best > reach) return null;
  // A point exactly between two different lines (usually near a dot) is
  // genuinely ambiguous. Reject it instead of selecting a surprising line.
  if (runnerUp - best < Math.min(5, cell * 0.12)) return null;
  return nearest;
}
