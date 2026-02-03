import { Native } from './native.js';
import { AudioController } from './audio.js';
import { CONSTANTS } from './constants.js';
import { Board } from './board.js';
import { AI } from './ai.js';
import { Renderer } from './renderer.js';

const audio = new AudioController();

export const Game = {
  board: null,
  renderer: null,
  ui: null,

  // State
  player: CONSTANTS.X,
  settings: { size: 6, mode: 'ai', diff: 'normal' },
  gameOver: false,
  aiThinking: false,
  lastMove: null,
  historyStack: [],

  init(canvasEl, uiRefs) {
    this.ui = uiRefs;
    this.renderer = new Renderer(canvasEl);
    Native.init();

    // Resize Listener
    window.addEventListener('resize', () => {
      if (this.board) this.renderer.resize(this.ui.viewGame, this.board.S);
    });

    const handleInput = (x, y) => this.processInput(x, y);
    canvasEl.addEventListener('mousedown', (e) =>
      handleInput(e.clientX, e.clientY),
    );
    canvasEl.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        handleInput(e.touches[0].clientX, e.touches[0].clientY);
      },
      { passive: false },
    );
  },

  start(size, mode, diff) {
    audio.init();
    this.settings = { size, mode, diff };
    document.getElementById('overlay').classList.remove('flex');
    localStorage.removeItem('rhombus_save');

    this.player = CONSTANTS.X;
    this.gameOver = false;
    this.historyStack = [];
    this.lastMove = null;

    // 1. Креирај логика
    this.board = new Board(size);

    // 2. Исчисти партикли
    this.renderer.particles = [];

    // 3. Смени го погледот (View)
    this.ui.viewMenu.classList.add('hidden');
    this.ui.viewMenu.classList.remove('active-view');
    this.ui.viewGame.classList.remove('hidden');
    this.ui.viewGame.classList.add('active-view');

    // 4. ИНСТАНТЕН RESIZE
    // Бидејќи renderer.js сега користи window.innerWidth, не мора да чекаме!
    // Веднаш ги поставуваме точните димензии пред прелистувачот да нацрта следен фрејм.
    this.renderer.resize(this.ui.viewGame, this.board.S);
    this.updateUI();

    // 5. Стартувај ја јамката веднаш
    requestAnimationFrame(() => this.loop());
  },

  processInput(clientX, clientY) {
    if (
      this.gameOver ||
      this.aiThinking ||
      (this.settings.mode === 'ai' && this.player === CONSTANTS.O)
    )
      return;

    const rect = this.renderer.canvas.getBoundingClientRect();
    const scaleX =
      this.renderer.canvas.width / rect.width / (window.devicePixelRatio || 1);
    const scaleY =
      this.renderer.canvas.height /
      rect.height /
      (window.devicePixelRatio || 1);
    const cx = (clientX - rect.left) * scaleX;
    const cy = (clientY - rect.top) * scaleY;

    const dx = (i) => this.renderer.offX + i * this.renderer.CELL;
    const dy = (j) => this.renderer.offY + j * this.renderer.CELL;
    const CELL = this.renderer.CELL;

    let best = null,
      minDist = CELL * 0.6;
    const moves = this.board.getFreeMoves();

    moves.forEach((m) => {
      const px = m.t === 'h' ? dx(m.c) + CELL / 2 : dx(m.c);
      const py = m.t === 'h' ? dy(m.r) : dy(m.r) + CELL / 2;
      const dist = Math.hypot(cx - px, cy - py);
      if (dist < minDist) {
        minDist = dist;
        best = m;
      }
    });

    if (best) this.executeMove(best);
  },

  executeMove(move) {
    this.historyStack.push({
      boardState: this.board.clone(),
      player: this.player,
      score: [...this.board.score],
    });

    const res = this.board.makeMove(move.t, move.r, move.c, this.player);
    if (!res) return;

    this.lastMove = move;
    Native.vibrate('light');

    if (res.points > 0) {
      audio.score();
      Native.vibrate('medium');
      res.capturedSquares.forEach((sq) => {
        this.renderer.spawnParticles(sq.r, sq.c, this.player);
      });
    } else {
      audio.move();
      this.player = 1 - this.player;
    }

    this.saveLocal();
    this.updateUI();

    if (this.board.isGameOver()) {
      setTimeout(() => this.endGame(), 500);
      return;
    }

    if (this.settings.mode === 'ai' && this.player === CONSTANTS.O) {
      const delay = 500 + Math.random() * 500;
      setTimeout(() => this.runAI(), delay);
    }
  },

  runAI() {
    this.aiThinking = true;
    const move = AI.getBestMove(this.board, this.settings.diff);
    if (move) {
      this.executeMove(move);
    }
    this.aiThinking = false;
  },

  undo() {
    if (this.historyStack.length === 0 || this.aiThinking) return;
    const s = this.historyStack.pop();
    this.board = s.boardState;
    this.player = s.player;
    this.board.score = s.score;
    this.updateUI();
    this.saveLocal();
    Native.vibrate('light');
  },

  endGame() {
    this.gameOver = true;
    audio.win();
    Native.vibrate('heavy');
    const s = this.board.score;
    document.getElementById('result-title').textContent =
      s[CONSTANTS.X] > s[CONSTANTS.O]
        ? 'You Win!'
        : s[CONSTANTS.O] > s[CONSTANTS.X]
          ? 'Game Over'
          : 'Draw';
    document.getElementById('result-score').textContent =
      `${s[CONSTANTS.X]} - ${s[CONSTANTS.O]}`;
    document.getElementById('overlay').classList.add('flex');
    localStorage.removeItem('rhombus_save');
  },

  updateUI() {
    this.ui.p1Score.textContent = this.board.score[CONSTANTS.X];
    this.ui.p2Score.textContent = this.board.score[CONSTANTS.O];
    if (this.player === CONSTANTS.X) {
      this.ui.p1Card.classList.add('active');
      this.ui.p2Card.classList.remove('active');
    } else {
      this.ui.p1Card.classList.remove('active');
      this.ui.p2Card.classList.add('active');
    }

    if (this.historyStack.length > 0)
      this.ui.undoBtn.classList.remove('disabled');
    else this.ui.undoBtn.classList.add('disabled');
  },

  loop() {
    if (this.ui.viewGame.classList.contains('hidden')) return;
    // Safety check: Ако canvas е 0 (на пример при ротација на екран), пробај resize пак
    if (this.renderer.CELL <= 0)
      this.renderer.resize(this.ui.viewGame, this.board.S);

    this.renderer.draw(this.board, this.lastMove);

    if (!this.gameOver || this.renderer.particles.length > 0)
      requestAnimationFrame(() => this.loop());
  },

  saveLocal() {
    if (this.gameOver) return;
    const state = {
      board: this.board,
      player: this.player,
      settings: this.settings,
      history: this.historyStack,
    };
    localStorage.setItem('rhombus_save', JSON.stringify(state));
  },
};
