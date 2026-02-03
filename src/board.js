import { CONSTANTS } from './constants.js';

export class Board {
  constructor(size) {
    this.init(size);
  }

  init(size) {
    this.R = Math.floor(size / 2);
    if (size == 4) this.R = 2; if (size == 6) this.R = 3; if (size == 8) this.R = 4;
    this.S = 2 * this.R + 1;
    this.C = this.R;
    this.D = this.S + 1;

    this.h = Array(this.D).fill().map(() => Array(this.S).fill(false));
    this.v = Array(this.S).fill().map(() => Array(this.D).fill(false));
    this.owner = Array(this.S).fill().map(() => Array(this.S).fill(null));
    this.score = [0, 0];
    
    this.setupPerimeter();
    this.setupInitialCells();
  }

  active(r, c) {
    return Math.abs(r - this.C) + Math.abs(c - this.C) <= this.R;
  }

  setupPerimeter() {
    for (let r = 0; r < this.D; r++) for (let c = 0; c < this.S; c++) {
      const up = (r > 0) ? this.active(r - 1, c) : false;
      const down = (r < this.S) ? this.active(r, c) : false;
      if (up !== down) this.h[r][c] = true;
    }
    for (let r = 0; r < this.S; r++) for (let c = 0; c < this.D; c++) {
      const left = (c > 0) ? this.active(r, c - 1) : false;
      const right = (c < this.S) ? this.active(r, c) : false;
      if (left !== right) this.v[r][c] = true;
    }
  }

  setupInitialCells() {
    const m = this.C;
    [{r:0,c:m,p:CONSTANTS.X}, {r:this.S-1,c:m,p:CONSTANTS.X}, 
     {r:m,c:0,p:CONSTANTS.O}, {r:m,c:this.S-1,p:CONSTANTS.O}].forEach(({r, c, p}) => {
      if (this.active(r, c)) {
        this.owner[r][c] = p; this.score[p]++;
        this.h[r][c] = this.h[r+1][c] = true;
        this.v[r][c] = this.v[r][c+1] = true;
      }
    });
  }

  // --- ПОПРАВКА ЗА БАГ 2: Враќаме кои точно квадрати се освоени ---
  makeMove(t, r, c, player) {
    if (t === 'h') {
        if (this.h[r][c]) return null;
        this.h[r][c] = true;
    } else {
        if (this.v[r][c]) return null;
        this.v[r][c] = true;
    }

    let captured = []; // Чуваме координати на освоените полиња
    
    const checkSq = (r, c) => {
      if (this.active(r, c) && this.owner[r][c] == null && 
          this.h[r][c] && this.h[r+1][c] && this.v[r][c] && this.v[r][c+1]) {
        this.owner[r][c] = player;
        this.score[player]++;
        captured.push({r, c}); // Додади во листата
      }
    };

    if (t === 'h') {
       if(r < this.S) checkSq(r, c);
       if(r > 0) checkSq(r-1, c);
    } else {
       if(c < this.S) checkSq(r, c);
       if(c > 0) checkSq(r, c-1);
    }

    // Враќаме објект со поени и листа на координати
    return { points: captured.length, capturedSquares: captured };
  }

  isGameOver() {
    for(let r=0; r<this.D; r++) for(let c=0; c<this.S; c++) 
       if(!this.h[r][c] && this.active(r,c) && this.active(r-1,c)) return false;
    for(let r=0; r<this.S; r++) for(let c=0; c<this.D; c++) 
       if(!this.v[r][c] && this.active(r,c) && this.active(r,c-1)) return false;
    return true;
  }

  getFreeMoves() {
    let moves = [];
    for (let r=0; r<this.D; r++) for (let c=0; c<this.S; c++) 
        if (!this.h[r][c] && this.active(r,c) && this.active(r-1,c)) moves.push({t:'h', r, c});
    for (let r=0; r<this.S; r++) for (let c=0; c<this.D; c++) 
        if (!this.v[r][c] && this.active(r,c) && this.active(r,c-1)) moves.push({t:'v', r, c});
    return moves;
  }

  clone() {
    const b = new Board(4); 
    b.R = this.R; b.S = this.S; b.C = this.C; b.D = this.D;
    b.h = this.h.map(row => [...row]);
    b.v = this.v.map(row => [...row]);
    b.owner = this.owner.map(row => [...row]);
    b.score = [...this.score];
    return b;
  }
}