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
  pendingTimer: null,
  timerGeneration: 0,

  cancelPendingAction() {
    this.timerGeneration++;
    if (this.pendingTimer !== null) clearTimeout(this.pendingTimer);
    this.pendingTimer = null;
  },

  scheduleAction(callback, delay) {
    this.cancelPendingAction();
    const generation = this.timerGeneration;
    this.pendingTimer = setTimeout(() => {
      if (generation !== this.timerGeneration || this.gameOver) return;
      this.pendingTimer = null;
      callback();
    }, delay);
  },

  stop() {
    this.cancelPendingAction();
    this.aiThinking = false;
    this.gameOver = true;
  },

  init(canvasEl, uiRefs) {
    this.ui = uiRefs;
    this.renderer = new Renderer(canvasEl);
    Native.init();

    // Resize Listener
    window.addEventListener('resize', () => {
      if (this.board) this.renderer.resize(this.ui.viewGame, this.board.S);
    });

    // One input path for mouse, touch and pen. Ignore secondary contacts
    // and non-primary buttons; compatibility mouse events have no listener.
    canvasEl.addEventListener('pointerdown', (e) => {
      if (!e.isPrimary || e.button !== 0) return;
      e.preventDefault();
      this.processInput(e.clientX, e.clientY);
    });
  },

  start(size, mode, diff) {
    this.stop();
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
    if (this.gameOver) return;
    const snapshot = {
      boardState: this.board.clone(),
      player: this.player,
      score: [...this.board.score],
      lastMove: this.lastMove ? { ...this.lastMove } : null,
    };

    const res = this.board.makeMove(move.t, move.r, move.c, this.player);
    if (!res) return;
    this.historyStack.push(snapshot);

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
      this.scheduleAction(() => this.endGame(), 500);
      return;
    }

    if (this.settings.mode === 'ai' && this.player === CONSTANTS.O) {
      const delay = 500 + Math.random() * 500;
      this.scheduleAction(() => this.runAI(), delay);
    }
  },

  runAI() {
    if (this.gameOver || this.settings.mode !== 'ai' ||
        this.player !== CONSTANTS.O || this.aiThinking) return;
    this.aiThinking = true;
    try {
      const move = AI.getBestMove(this.board, this.settings.diff);
      if (move) this.executeMove(move);
    } finally {
      this.aiThinking = false;
    }
  },

  undo() {
    if (this.gameOver || this.historyStack.length === 0 || this.aiThinking) return;
    // In AI mode, restore the decision before the latest human move,
    // including every extra move earned by the computer afterwards.
    let index = this.historyStack.length - 1;
    if (this.settings.mode === 'ai') {
      while (index >= 0 && this.historyStack[index].player !== CONSTANTS.X) index--;
      if (index < 0) return;
    }
    this.cancelPendingAction();
    const s = this.historyStack[index];
    this.historyStack.length = index;
    this.board = s.boardState;
    this.player = s.player;
    this.board.score = s.score;
    this.lastMove = s.lastMove;
    this.renderer.particles = [];
    this.updateUI();
    this.saveLocal();
    Native.vibrate('light');
  },

  endGame() {
    if (this.gameOver || !this.board.isGameOver()) return;
    this.cancelPendingAction();
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

