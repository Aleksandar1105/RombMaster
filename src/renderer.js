import { CONSTANTS } from './constants.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.particles = [];
    this.CELL = 0;
    this.offX = 0;
    this.offY = 0;
  }

  resize(viewElement, boardS) {
    // Use the available game panel, rather than guessing a fixed amount of
    // vertical space. This leaves room for the score, turn banner and buttons
    // on short phones and allows scrolling in landscape.
    const width = viewElement.clientWidth || window.innerWidth;
    const height = viewElement.clientHeight || window.innerHeight;
    const measure = selector => {
      const el = viewElement.querySelector?.(selector);
      return el?.getBoundingClientRect?.().height || 0;
    };
    const reserved = measure('#match-mode') + measure('#scoreboard') + measure('#turn-status') +
      measure('#controls') + measure('#game-save-status') + 100;
    const availableWidth = Math.max(120, width - 48);
    const availableHeight = Math.max(160, height - reserved);
    // Upper bound keeps the board usable on tablets without gigantic controls.
    const size = Math.max(120, Math.floor(Math.min(availableWidth, availableHeight, 520)));
    const dpr = Math.min(window.devicePixelRatio || 1, 3);

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.canvas.width = Math.round(size * dpr);
    this.canvas.height = Math.round(size * dpr);
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    this.ctx.scale(dpr, dpr);

    this.CELL = Math.floor(size / (boardS + 1));
    const gridPx = boardS * this.CELL;
    this.offX = (size - gridPx) / 2;
    this.offY = (size - gridPx) / 2;
  }

  draw(board, lastMove, previewMove = null) {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = CONSTANTS.COLORS.bg;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    const dx = i => this.offX + i * this.CELL;
    const dy = j => this.offY + j * this.CELL;

    

    // Owners
    for (let r = 0; r < board.S; r++) for (let c = 0; c < board.S; c++) {
      if (board.active(r, c) && board.owner[r][c] != null) {
        const owner = board.owner[r][c];
        const x = dx(c), y = dy(r), size = this.CELL;
        const rgb = owner === CONSTANTS.X ? '255,68,95' : '0,224,224';
        const fill = this.ctx.createLinearGradient(x, y, x + size, y + size);
        fill.addColorStop(0, 'rgba(' + rgb + ',.70)');
        fill.addColorStop(.48, 'rgba(' + rgb + ',.28)');
        fill.addColorStop(1, 'rgba(' + rgb + ',.58)');
        this.ctx.fillStyle = fill;
        this.ctx.fillRect(x, y, size, size);
        this.ctx.save();
        this.ctx.translate(x + size / 2, y + size / 2);
        this.ctx.strokeStyle = owner === CONSTANTS.X ? '#ffbdc7' : '#adffff';
        this.ctx.shadowColor = 'rgb(' + rgb + ')';
        this.ctx.shadowBlur = Math.min(10, size / 4);
        this.ctx.lineWidth = Math.max(2, size * .078);
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        const arm = size * .19;
        if (owner === CONSTANTS.X) {
          this.ctx.moveTo(-arm,-arm); this.ctx.lineTo(arm,arm);
          this.ctx.moveTo(arm,-arm); this.ctx.lineTo(-arm,arm);
        } else {
          this.ctx.arc(0, 0, size * .24, 0, Math.PI * 2);
        }
        this.ctx.stroke();
        this.ctx.restore();
      }
    }

    // Lines Function
    const drawLine = (r, c, type, isGhost) => {
        this.ctx.beginPath();
        const x1 = dx(c), y1 = dy(r);
        const x2 = type === 'h' ? dx(c+1) : dx(c);
        const y2 = type === 'h' ? dy(r) : dy(r+1);
        this.ctx.moveTo(x1, y1); this.ctx.lineTo(x2, y2);

        if (isGhost) {
            this.ctx.strokeStyle = CONSTANTS.COLORS.lineActive;
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([2, 8]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        } else {
            const isLast = lastMove && lastMove.t === type && lastMove.r === r && lastMove.c === c;
            if (isLast) {
                this.ctx.strokeStyle = CONSTANTS.COLORS.lastMove;
                this.ctx.lineWidth = 4;
                this.ctx.lineCap = "round";
                this.ctx.shadowBlur = 15; this.ctx.shadowColor = CONSTANTS.COLORS.glow;
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            } else {
                this.ctx.strokeStyle = CONSTANTS.COLORS.linePlayed;
                this.ctx.lineWidth = 3;
                this.ctx.lineCap = "round";
                this.ctx.stroke();
            }
        }
    };

    // Draw Lines
    for (let r = 0; r < board.D; r++) for (let c = 0; c < board.S; c++) if (board.h[r][c]) drawLine(r, c, 'h', false);
    for (let r = 0; r < board.S; r++) for (let c = 0; c < board.D; c++) if (board.v[r][c]) drawLine(r, c, 'v', false);
    
    for (let r=0; r<board.D; r++) for (let c=0; c<board.S; c++) if(!board.h[r][c] && board.active(r,c) && board.active(r-1,c)) drawLine(r, c, 'h', true);
    for (let r=0; r<board.S; r++) for (let c=0; c<board.D; c++) if(!board.v[r][c] && board.active(r,c) && board.active(r,c-1)) drawLine(r, c, 'v', true);

    // Preview hovered line without changing the Board; never render a played
    // line as a new suggested move.
    if (previewMove && board.getFreeMoves().some(m =>
      m.t === previewMove.t && m.r === previewMove.r && m.c === previewMove.c)) {
      const x1 = dx(previewMove.c), y1 = dy(previewMove.r);
      const x2 = previewMove.t === 'h' ? dx(previewMove.c + 1) : x1;
      const y2 = previewMove.t === 'v' ? dy(previewMove.r + 1) : y1;
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.strokeStyle = '#fbbf24';
      this.ctx.lineWidth = Math.max(5, this.CELL * 0.14);
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
      this.ctx.restore();
    }

    this.updateParticles();

    // Dots
    this.ctx.fillStyle = "#a5c5df"; 
    const dotR = Math.max(3, this.CELL / 12);
    for (let r=0; r<=board.S; r++) for (let c=0; c<=board.S; c++) {
      if (board.active(r,c) || board.active(r-1,c) || board.active(r,c-1) || board.active(r-1,c-1)) {
        this.ctx.beginPath(); this.ctx.arc(dx(c), dy(r), dotR, 0, Math.PI*2); this.ctx.fill();
      }
    }
  }

  spawnParticles(r, c, player) {
    const dx = i => this.offX + i * this.CELL;
    const dy = j => this.offY + j * this.CELL;
    const px = dx(c) + this.CELL/2, py = dy(r) + this.CELL/2;
    const color = player === CONSTANTS.X ? CONSTANTS.COLORS.x : CONSTANTS.COLORS.o;
    
    for(let i=0; i<15; i++) {
        this.particles.push({
            x:px, y:py, color: color,
            vx:(Math.random()-0.5)*10, vy:(Math.random()-0.5)*10,
            life:1, size:5
        });
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx; p.y += p.vy; p.vx *= 0.9; p.vy *= 0.9; p.life -= 0.05; p.size *= 0.94;
        this.ctx.globalAlpha = p.life; this.ctx.fillStyle = p.color;
        this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
        if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  roundRect(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2; if (h < 2 * r) r = h / 2;
    this.ctx.beginPath(); this.ctx.moveTo(x+r, y); this.ctx.arcTo(x+w, y, x+w, y+h, r); this.ctx.arcTo(x+w, y+h, x, y+h, r); this.ctx.arcTo(x, y+h, x, y, r); this.ctx.arcTo(x, y, x+w, y, r); this.ctx.closePath();
  }
}
