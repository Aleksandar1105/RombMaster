import { CONSTANTS } from './constants.js';
import { activeSkin } from './skins.js';

export class Renderer {
  constructor(canvas, skin = null) {
    this.skin = skin;
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

    this.CELL = (size - 14) / boardS;
    const gridPx = boardS * this.CELL;
    this.offX = (size - gridPx) / 2;
    this.offY = (size - gridPx) / 2;
  }

  draw(board, lastMove, previewMove = null) {
    const skin = this.skin || activeSkin();
    const colors = skin.colors;
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = colors.bg;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    const dx = i => this.offX + i * this.CELL;
    const dy = j => this.offY + j * this.CELL;

    

    // Owners
    for (let r = 0; r < board.S; r++) for (let c = 0; c < board.S; c++) {
      if (board.active(r, c) && board.owner[r][c] != null) {
        const owner = board.owner[r][c];
        const x = dx(c), y = dy(r), size = this.CELL;
        const color = owner === CONSTANTS.X ? colors.x : colors.o;
        if (skin.fill === 'inset') {
          const inset = size * .15;
          this.ctx.fillStyle = color + '2b';
          this.roundRect(x + inset, y + inset, size - 2 * inset, size - 2 * inset, size * .14);
          this.ctx.fill();
        } else {
          this.paintCapture(skin, x, y, size, color);
        }
        this.drawSymbol(skin, owner, x + size / 2, y + size / 2, size);
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
            this.ctx.strokeStyle = colors.lineActive;
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([1.5, Math.min(5, this.CELL / 5)]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        } else {
            const isLast = lastMove && lastMove.t === type && lastMove.r === r && lastMove.c === c;
            const before = type === 'h' ? board.owner[r - 1]?.[c] : board.owner[r]?.[c - 1];
            const after = board.owner[r]?.[c];
            const owner = before ?? after;
            const color = owner === CONSTANTS.X ? colors.x : colors.o;
            const width = Math.max(.85, Math.min(1.6, this.CELL * .045));
            this.ctx.lineWidth = width;
            this.ctx.lineCap = "round";
            this.ctx.strokeStyle = isLast ? colors.lastMove : colors.linePlayed;
            if (owner != null) this.ctx.strokeStyle = color;
            if (before != null && after != null && before !== after) {
                // One centered stroke; interpolate across its width, not along its length.
                // The negative side belongs to the top/left cell, the positive to bottom/right.
                // Keep the shared boundary exactly one logical pixel at every board size.
                this.ctx.lineWidth = 1;
                const half = this.ctx.lineWidth / 2;
                const gx = type === 'v' ? half : 0;
                const gy = type === 'h' ? half : 0;
                const beforeColor = before === CONSTANTS.X ? colors.x : colors.o;
                const afterColor = after === CONSTANTS.X ? colors.x : colors.o;
                const edge = this.ctx.createLinearGradient(x1 - gx, y1 - gy, x1 + gx, y1 + gy);
                edge.addColorStop(0, beforeColor);
                edge.addColorStop(.35, beforeColor);
                edge.addColorStop(.65, afterColor);
                edge.addColorStop(1, afterColor);
                this.ctx.strokeStyle = edge;
                this.ctx.shadowBlur = 0;
                this.ctx.stroke();
                return;
            }
            this.ctx.shadowColor = isLast ? colors.glow : color;
            this.ctx.shadowBlur = isLast ? (skin.id === 'white' || skin.id === 'wood' ? 0 : 10) : owner != null ? Math.min(3, skin.finish.glow) : 0;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
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
      this.ctx.strokeStyle = colors.lastMove;
      this.ctx.lineWidth = Math.max(5, this.CELL * 0.14);
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
      this.ctx.restore();
    }

    this.updateParticles();

    // Dots
    this.ctx.fillStyle = colors.dot; 
    const dotR = Math.max(1.4, Math.min(4, this.CELL * .065));
    for (let r=0; r<=board.S; r++) for (let c=0; c<=board.S; c++) {
      if (board.active(r,c) || board.active(r-1,c) || board.active(r,c-1) || board.active(r-1,c-1)) {
        this.ctx.beginPath(); this.ctx.arc(dx(c), dy(r), dotR, 0, Math.PI*2); this.ctx.fill();
      }
    }
  }

  // One symbol renderer is shared by gameplay, previews and the catalog.
  // Coordinates are relative to the cell centre; no decoration reaches its edge.
  drawSymbol(skin, owner, cx, cy, size) {
    const ctx=this.ctx, x=owner===CONSTANTS.X;
    const color=x?skin.colors.x:skin.colors.o;
    const a=size*.19, r=size*.23;
    ctx.save();
    ctx.translate(cx,cy);
    ctx.strokeStyle=color;
    ctx.shadowColor=color;
    ctx.shadowBlur=Math.min(skin.finish.glow,size/4);
    ctx.lineWidth=Math.max(2,size*skin.finish.symbolWeight);
    ctx.lineCap='round';
    ctx.lineJoin='round';
    const trace=()=>{
      ctx.beginPath();
      if(x) {
        ctx.moveTo(-a,-a);ctx.lineTo(a,a);
        ctx.moveTo(a,-a);ctx.lineTo(-a,a);
      } else if(skin.id==='cyber'||skin.id==='ice') {
        const n=skin.id==='cyber'?8:6;
        for(let i=0;i<n;i++){
          const t=-Math.PI/2+Math.PI*2*i/n;
          const xx=Math.cos(t)*r,yy=Math.sin(t)*r;
          if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
        }
        ctx.closePath();
      } else ctx.arc(0,0,r,0,Math.PI*2);
    };
    if(skin.id==='royal'||skin.id==='wood'||skin.id==='ice') {
      ctx.lineCap=skin.id==='ice'?'square':'round';
      trace();ctx.stroke();
      ctx.shadowBlur=0;
      ctx.strokeStyle=skin.id==='wood'?'#39261c80':'#ffffff85';
      ctx.lineWidth=Math.max(.7,size*.018);
      trace();ctx.stroke();
    } else {
      if(skin.id==='cyber')ctx.lineCap='square';
      trace();ctx.stroke();
    }
    if(skin.id==='royal'&&x){
      ctx.shadowBlur=0;ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,size*.024);
      ctx.beginPath();
      for(const [xx,yy] of [[-a,-a],[a,-a],[-a,a],[a,a]]){
        ctx.moveTo(xx-size*.045,yy);ctx.lineTo(xx+size*.045,yy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // Painted details stay within the captured square. The shared-edge pass
  // below still paints exactly one centered line, regardless of texture.
  paintCapture(skin, x, y, size, color) {
    const ctx = this.ctx;
    const material = skin.finish.material;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, size, size);
    ctx.clip();
    if (material === 'matte') {
      ctx.fillStyle = color + '16';
      ctx.fillRect(x, y, size, size);
    } else {
      const g = ctx.createLinearGradient(x, y, x + size, y + size);
      const stops = material === 'metal' ? [[0,'60'],[.22,'28'],[.46,'50'],[.54,'20'],[1,'55']] :
        material === 'crystal' ? [[0,'62'],[.4,'26'],[.68,'52'],[1,'24']] :
        material === 'grain' ? [[0,'38'],[.5,'20'],[1,'50']] :
        [[0,'52'],[.5,'20'],[1,'48']];
      for (const [at,alpha] of stops) g.addColorStop(at,color + alpha);
      ctx.fillStyle = g;
      ctx.fillRect(x,y,size,size);
      ctx.lineWidth = Math.max(.5,size*.012);
      ctx.strokeStyle = color + '32';
      ctx.fillStyle = color + '16';
      // Sparse, deterministic accents; no per-frame randomness or external art.
      if (material === 'grain') {
        for (let i=1;i<=4;i++) {
          const yy=y+size*(i/5);
          ctx.beginPath(); ctx.moveTo(x,yy);
          ctx.bezierCurveTo(x+size*.3,yy-size*.07,x+size*.65,yy+size*.06,x+size,yy);
          ctx.stroke();
        }
      } else if (material === 'crystal') {
        ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+size*.43,y);
        ctx.lineTo(x,y+size*.54); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x+size,y+size); ctx.lineTo(x+size*.68,y+size);
        ctx.lineTo(x+size,y+size*.48); ctx.closePath(); ctx.fill();
      } else if (material === 'circuit') {
        const a=size*.1, b=size*.27;
        ctx.beginPath(); ctx.moveTo(x+a,y+b); ctx.lineTo(x+a,y+a);
        ctx.lineTo(x+b,y+a); ctx.moveTo(x+size-b,y+size-a);
        ctx.lineTo(x+size-a,y+size-a); ctx.lineTo(x+size-a,y+size-b);
        ctx.stroke();
      } else if (material === 'metal') {
        ctx.beginPath(); ctx.moveTo(x+size*.12,y+size*.22);
        ctx.lineTo(x+size*.22,y+size*.12); ctx.lineTo(x+size*.78,y+size*.12);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  spawnParticles(r, c, player) {
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
    const skin = this.skin || activeSkin();
    const color = player === CONSTANTS.X ? skin.colors.x : skin.colors.o;
    // Grid coordinates keep the animation aligned through a resize.
    const born = Date.now();
    this.particles.push({r,c,color,born,duration:skin.finish.duration,effect:skin.finish.effect,count:skin.finish.particles});
    // Bound memory when several cells are captured in a rapid chain.
    if (this.particles.length > 48) this.particles.splice(0,this.particles.length-48);
  }

  updateParticles() {
    const ctx = this.ctx;
    const now = Date.now();
    for (let i=this.particles.length-1;i>=0;i--) {
      const p=this.particles[i];
      const t=Math.max(0,(now-p.born)/p.duration);
      if (t>=1) { this.particles.splice(i,1); continue; }
      const size=this.CELL,x=this.offX+p.c*size,y=this.offY+p.r*size;
      const cx=x+size/2,cy=y+size/2;
      const a=1-t, ease=1-Math.pow(1-t,3);
      ctx.save();
      // Keep the shared edge and neighboring cells completely unobscured.
      const margin=Math.max(2,size*.045);
      ctx.beginPath(); ctx.rect(x+margin,y+margin,size-2*margin,size-2*margin); ctx.clip();
      ctx.strokeStyle=p.color; ctx.fillStyle=p.color;
      ctx.lineWidth=Math.max(1,size*.025);
      ctx.globalAlpha=.65*a;
      if (p.effect==='scan') {
        const yy=y+size*(.1+.8*ease);
        ctx.fillRect(x+margin,yy,size-2*margin,Math.max(2,size*.045));
        ctx.strokeRect(x+size*.12,y+size*.12,size*.76,size*.76);
      } else if (p.effect==='shard') {
        for (let j=0;j<6;j++) {
          const theta=j*Math.PI/3,r=size*(.12+.25*ease);
          const xx=cx+Math.cos(theta)*r,yy=cy+Math.sin(theta)*r;
          const h=size*.065*a;
          ctx.beginPath(); ctx.moveTo(xx,yy-h);ctx.lineTo(xx+h*.65,yy);
          ctx.lineTo(xx,yy+h);ctx.lineTo(xx-h*.65,yy);ctx.closePath();ctx.fill();
        }
      } else if (p.effect==='dust') {
        for (let j=0;j<p.count;j++) {
          const theta=j*2.399963,r=size*(.1+.29*ease);
          ctx.beginPath();ctx.arc(cx+Math.cos(theta)*r,cy+Math.sin(theta)*r,
            Math.max(.5,size*.023*a),0,Math.PI*2);ctx.fill();
        }
      } else {
        ctx.beginPath();ctx.arc(cx,cy,size*(.15+.34*ease),0,Math.PI*2);ctx.stroke();
        if (p.effect==='spark' || p.effect==='ring') {
          for(let j=0;j<p.count;j++) {
            const theta=j*Math.PI*2/p.count,r=size*(.16+.31*ease);
            const xx=cx+Math.cos(theta)*r,yy=cy+Math.sin(theta)*r;
            const h=size*.035*a;
            if(p.effect==='spark') {
              ctx.beginPath();ctx.moveTo(xx-h,yy);ctx.lineTo(xx+h,yy);
              ctx.moveTo(xx,yy-h);ctx.lineTo(xx,yy+h);ctx.stroke();
            } else {
              ctx.beginPath();ctx.arc(xx,yy,Math.max(.4,h),0,Math.PI*2);ctx.fill();
            }
          }
        }
      }
      ctx.restore();
    }
  }

  roundRect(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2; if (h < 2 * r) r = h / 2;
    this.ctx.beginPath(); this.ctx.moveTo(x+r, y); this.ctx.arcTo(x+w, y, x+w, y+h, r); this.ctx.arcTo(x+w, y+h, x, y+h, r); this.ctx.arcTo(x, y+h, x, y, r); this.ctx.arcTo(x, y, x+w, y, r); this.ctx.closePath();
  }
}
