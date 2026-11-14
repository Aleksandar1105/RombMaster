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
  if(level>=1&&level<=5)return openings[level-1];
  // New openings only beyond the historical 30 levels. Version 1 is deterministic;
  // never change this algorithm without a new save opening version.
  if(!Number.isInteger(level)||level<31||level>100)return undefined;
  const size=level<=60?8:10, board=new Board(size),edges=[];
  let seed=(level*2654435761)>>>0;
  for(let i=0;i<Math.min(10,3+Math.floor((level-31)/10));i++){
    const safe=board.getFreeMoves().filter(m=>{
      const trial=board.clone();
      return trial.makeMove(m.t,m.r,m.c,1).points===0;
    });
    if(!safe.length)break;
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const m=safe[seed%safe.length];board[m.t][m.r][m.c]=true;edges.push([m.t,m.r,m.c]);
  }
  const boss=[40,60,80,100].includes(level);
  return {title:boss?'Boss Battle': ['Chain Control','Safe Passage','Counterattack','Endgame Trial'][level%4],
    clue:boss?'Defeat the world rival to advance.':'Read the opening and avoid giving away free captures.',edges};
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
