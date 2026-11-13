import { Board } from './board.js';

// Coordinates use Board's horizontal/vertical edge grids. Keep version 1
// openings stable: saved games replay their move logs on these positions.
const openings = [
  { title: 'First Capture', clue: 'Close the fourth side and play again.', edges: [['h', 2, 1]] },
  { title: 'The Trap', clue: 'Find a safe line. A third side gives your rival a point.', edges: [['v', 2, 2]] },
  { title: 'Double Capture', clue: 'Win with a double capture to earn three stars.', edges: [['h', 2, 1], ['h', 2, 2], ['v', 1, 3]] },
  { title: 'Chain Reaction', clue: 'Follow the top row. One capture can lead to three.', edges: [['h', 2, 1], ['h', 2, 2], ['h', 2, 3]] },
  { title: 'Fox Duel', clue: 'Find the longer chain. Beat the Fox to earn the Neon Fox avatar.', edges: [['h', 2, 1], ['h', 3, 1], ['h', 3, 2], ['h', 3, 3], ['v', 2, 3]] },
];

export function missionFor(level) {
  return openings[level - 1];
}

export function startingBoard(settings) {
  const board = new Board(settings.size);
  if (settings.openingVersion === 1) {
    for (const [direction, row, column] of missionFor(settings.careerLevel).edges) {
      board[direction][row][column] = true;
    }
  }
  return board;
}

export function drawOpening(canvas, stage) {
  const ctx = canvas?.getContext?.('2d');
  if (!ctx) return;
  const board = startingBoard({ size: stage.size, careerLevel: stage.level,
    openingVersion: missionFor(stage.level) ? 1 : undefined });
  const step = (canvas.width - 8) / board.S;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = Math.max(1.3, step * 0.14);
  ctx.lineCap = 'round';
  for (let r = 0; r < board.S; r++) {
    for (let c = 0; c < board.S; c++) {
      if (!board.active(r, c)) continue;
      const x = 4 + c * step, y = 4 + r * step;
      ctx.fillStyle = board.owner[r][c] === null ? '#40385c' : board.owner[r][c] ? '#fb7185' : '#22d3ee';
      ctx.fillRect(x + 1, y + 1, step - 2, step - 2);
      ctx.strokeStyle = '#ede5ff';
      ctx.beginPath();
      if (board.h[r][c]) { ctx.moveTo(x, y); ctx.lineTo(x + step, y); }
      if (board.v[r][c]) { ctx.moveTo(x, y); ctx.lineTo(x, y + step); }
      if (board.h[r + 1][c]) { ctx.moveTo(x, y + step); ctx.lineTo(x + step, y + step); }
      if (board.v[r][c + 1]) { ctx.moveTo(x + step, y); ctx.lineTo(x + step, y + step); }
      ctx.stroke();
    }
  }
}
