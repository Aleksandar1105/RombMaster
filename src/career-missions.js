import { Renderer } from './renderer.js';
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
  const preview = new Renderer(canvas);
  preview.CELL = (canvas.width - 10) / board.S;
  preview.offX = preview.offY = 5;
  preview.draw(board, null);
}
