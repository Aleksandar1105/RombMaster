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
    // 1. БРИШЕЊЕ НА СТИЛОВИ: Ги тргаме фиксните димензии за момент
    // за да не сметаат на layout-от.
    this.canvas.style.width = '';
    this.canvas.style.height = '';

    // 2. МЕРЕЊЕ НА ЕКРАНОТ (WINDOW):
    // Наместо да го мериме viewElement (кој може да се растегне),
    // ги земаме директните димензии на прозорецот/екранот.
    const w = window.innerWidth;
    const h = window.innerHeight;

    // 3. ПРЕСМЕТКА НА ПРОСТОР:
    // padding: 40px (20px лево + 20px десно од .view класата во CSS)
    const padding = 40; 
    
    const isDesktop = w > 800;
    // Desktop: 220px за UI, Mobile: 140px (малку повеќе safety space)
    const uiSpace = isDesktop ? 220 : 140; 

    const mw = w - padding;
    let mh = h - uiSpace;
    if (mh < 200) mh = 200;

    const size = Math.floor(Math.min(mw, mh));
    const dpr = window.devicePixelRatio || 1;

    // 4. ПРИМЕНА НА ДИМЕНЗИИ:
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    this.ctx.scale(dpr, dpr);

    this.CELL = Math.floor(size / (boardS + 1));
    const gridPx = boardS * this.CELL;
    this.offX = (size - gridPx) / 2;
    this.offY = (size - gridPx) / 2;
  }

  draw(board, lastMove) {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = CONSTANTS.COLORS.bg;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    const dx = i => this.offX + i * this.CELL;
    const dy = j => this.offY + j * this.CELL;

    this.updateParticles();

    // Owners
    for (let r = 0; r < board.S; r++) for (let c = 0; c < board.S; c++) {
      if (board.active(r, c) && board.owner[r][c] != null) {
        const owner = board.owner[r][c];
        const pad = this.CELL * 0.15;
        this.ctx.fillStyle = owner === CONSTANTS.X ? CONSTANTS.COLORS.xDim : CONSTANTS.COLORS.oDim;
        this.roundRect(dx(c)+pad, dy(r)+pad, this.CELL-pad*2, this.CELL-pad*2, 8); 
        this.ctx.fill();
        
        this.ctx.fillStyle = owner === CONSTANTS.X ? CONSTANTS.COLORS.x : CONSTANTS.COLORS.o;
        this.ctx.font = `800 ${this.CELL * 0.5}px Montserrat`; 
        this.ctx.textAlign = "center"; this.ctx.textBaseline = "middle";
        this.ctx.fillText(owner === CONSTANTS.X ? "X" : "O", dx(c) + this.CELL/2, dy(r) + this.CELL/2 + 2);
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

    // Dots
    this.ctx.fillStyle = "#64748b"; 
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