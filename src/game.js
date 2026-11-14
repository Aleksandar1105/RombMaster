import { Native } from './native.js';
import { AudioController } from './audio.js';
import { CONSTANTS } from './constants.js';
import { missionFor, startingBoard, drawOpening } from './career-missions.js';
import { AI } from './ai.js';
import { Renderer } from './renderer.js';
import { SaveStore } from './save.js';
import { ProfileStore, careerLevel, threeStarTarget } from './profile.js';
import { nearestLegalLine, canvasPoint } from './input.js';

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
  hoverMove: null,
  historyStack: [],
  moveLog: [],
  careerOutcome: null,
  careerUndosUsed: 0,
  saveFailed: false,
  paused: false,
  inactiveSources: new Set(),

  setActive(source, isActive) {
    if (isActive) this.inactiveSources.delete(source);
    else this.inactiveSources.add(source);
    const paused = this.inactiveSources.size > 0;
    if (paused === this.paused) return;
    this.paused = paused;
    if (paused) {
      // Never copy a stopped prior player's board into the newly active slot.
      if (this.board && !this.ui.viewGame.classList.contains('hidden') && !this.gameOver) this.saveLocal();
      this.cancelPendingAction();
      this.cancelAnimation();
      this.hoverMove = null;
      audio.pause();
      if (this.board) this.updateUI();
      return;
    }
    if (!this.board || this.ui.viewGame.classList.contains('hidden')) return;
    audio.resume();
    this.renderer.resize(this.ui.viewGame, this.board.S);
    this.requestRender();
    this.updateUI();
    if (this.gameOver) return;
    if (this.board.isGameOver()) this.scheduleAction(() => this.endGame(), 500);
    else if (this.settings.mode === 'ai' && this.player === CONSTANTS.O) {
      this.scheduleAction(() => this.runAI(), 500);
    }
  },
  pendingTimer: null,
  timerGeneration: 0,
  animationFrame: null,
  animationGeneration: 0,

  cancelAnimation() {
    this.animationGeneration++;
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
  },

  requestRender() {
    if (this.paused || this.animationFrame !== null || !this.board ||
        this.ui.viewGame.classList.contains('hidden')) return;
    const generation = this.animationGeneration;
    this.animationFrame = requestAnimationFrame(() => {
      if (generation !== this.animationGeneration) return;
      this.animationFrame = null;
      this.loop();
    });
  },

  cancelPendingAction() {
    this.timerGeneration++;
    if (this.pendingTimer !== null) clearTimeout(this.pendingTimer);
    this.pendingTimer = null;
  },

  scheduleAction(callback, delay) {
    this.cancelPendingAction();
    if (this.paused) return;
    const generation = this.timerGeneration;
    this.pendingTimer = setTimeout(() => {
      if (generation !== this.timerGeneration || this.gameOver || this.paused) return;
      this.pendingTimer = null;
      callback();
    }, delay);
  },

  stop() {
    this.cancelPendingAction();
    this.cancelAnimation();
    this.hoverMove = null;
    audio.pause();
    this.aiThinking = false;
    this.gameOver = true;
  },

  setSoundEnabled(enabled) { audio.enabled = Boolean(enabled); },

  init(canvasEl, uiRefs) {
    this.ui = uiRefs;
    this.renderer = new Renderer(canvasEl);
    Native.init();

    // Resize Listener
    window.addEventListener('resize', () => {
      if (this.board && !this.ui.viewGame.classList.contains('hidden')) {
        this.renderer.resize(this.ui.viewGame, this.board.S);
        this.requestRender();
      }
    });

    // One input path for mouse, touch and pen. Ignore secondary contacts
    // and non-primary buttons; compatibility mouse events have no listener.
    canvasEl.addEventListener('pointerdown', (e) => {
      if (!e.isPrimary || e.button !== 0) return;
      e.preventDefault();
      this.hoverMove = null;
      this.processInput(e.clientX, e.clientY);
    });
    // Hover is informative only; no move is committed until pointerdown.
    canvasEl.addEventListener('pointermove', (e) => {
      if (!e.isPrimary || !['mouse', 'pen'].includes(e.pointerType) ||
          e.buttons) return;
      const move = this.canHumanMove() ? this.findLine(e.clientX, e.clientY) : null;
      if (JSON.stringify(move) !== JSON.stringify(this.hoverMove)) {
        this.hoverMove = move;
        this.requestRender();
      }
    });
    for (const event of ['pointerleave', 'pointercancel']) {
      canvasEl.addEventListener(event, () => {
        if (this.hoverMove) {
          this.hoverMove = null;
          this.requestRender();
        }
      });
    }
  },

  start(size, mode, diff, career = null) {
    if (career !== null) {
      const stage = careerLevel(career);
      if (mode !== 'ai' || size !== stage.size || diff !== stage.diff) return false;
      const state = ProfileStore.read();
      if (!['ready', 'empty'].includes(state.status) || career > state.profile.unlockedLevel) return false;
    }
    this.stop();
    audio.init();
    this.settings = career === null ? { size, mode, diff } : { size, mode, diff, careerLevel: career };
    document.getElementById('overlay').classList.remove('flex');
    const reward = document.getElementById('career-reward');
    if (reward) { reward.hidden = true; reward.textContent = ''; }
    const nextButton = document.getElementById('nextCareerBtn');
    if (nextButton) nextButton.hidden = true;

    this.player = CONSTANTS.X;
    this.gameOver = false;
    this.historyStack = [];
    this.moveLog = [];
    this.careerOutcome = null;
    this.careerUndosUsed = 0;
    this.lastMove = null;
    this.hoverMove = null;

    // 1. Креирај логика
    if (missionFor(career)) this.settings.openingVersion = 1;
    this.board = startingBoard(this.settings);

    this.showBoard();
    this.saveLocal();
    return true;
  },

  showBoard() {
    const aiMatch = this.settings.mode === 'ai';
    const playerName = aiMatch ? ProfileStore.read().profile?.name || 'You' : 'Player 1';
    this.firstPlayerName = playerName;
    const setLabel = (id, value) => {
      const item = document.getElementById(id);
      if (item) item.textContent = value;
    };
    setLabel('p1-name', playerName + ' · X');
    this.rivalName = this.settings.openingVersion && this.settings.careerLevel === 5 ? '🦊 Fox' : 'Computer';
    setLabel('p2-name', (aiMatch ? this.rivalName : 'Player 2') + ' · O');
    this.updateUI();
    if (this.paused) audio.pause();
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

    // 5. Стартувај ја јамката веднаш
    this.requestRender();
  },

  canHumanMove() {
    return !!this.board && !this.gameOver && !this.paused && !this.aiThinking &&
      !(this.settings.mode === 'ai' && this.player === CONSTANTS.O) &&
      !this.ui.viewGame.classList.contains('hidden');
  },

  findLine(clientX, clientY) {
    if (!this.board || !this.renderer.canvas) return null;
    const point = canvasPoint(this.renderer.canvas, clientX, clientY);
    if (!point) return null;
    return nearestLegalLine(this.board, this.renderer.CELL,
      this.renderer.offX, this.renderer.offY, point.x, point.y);
  },

  processInput(clientX, clientY) {
    if (!this.canHumanMove()) return;
    const best = this.findLine(clientX, clientY);
    if (best) this.executeMove(best);
  },

  executeMove(move) {
    if (this.gameOver || this.paused) return;
    const snapshot = {
      boardState: this.board.clone(),
      player: this.player,
      score: [...this.board.score],
      lastMove: this.lastMove ? { ...this.lastMove } : null,
    };

    const res = this.board.makeMove(move.t, move.r, move.c, this.player);
    if (!res) return;
    this.historyStack.push(snapshot);
    this.moveLog.push({ t: move.t, r: move.r, c: move.c });

    this.lastMove = move;
    this.hoverMove = null;
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
      // Store career progress synchronously at the final move, not after the
      // delayed result animation, so background termination loses no reward.
      if (this.settings.careerLevel && this.careerOutcome === null) {
        this.careerOutcome = ProfileStore.recordCareer(
          this.settings.careerLevel, this.board.score[CONSTANTS.X], this.board.score[CONSTANTS.O], this.doubleCaptureGoal()
        );
      }
      this.scheduleAction(() => this.endGame(), 500);
      return;
    }

    if (this.settings.mode === 'ai' && this.player === CONSTANTS.O) {
      const delay = 500 + Math.random() * 500;
      this.scheduleAction(() => this.runAI(), delay);
    }
  },

  runAI() {
    if (this.gameOver || this.paused || this.settings.mode !== 'ai' ||
        this.player !== CONSTANTS.O || this.aiThinking) return;
    this.aiThinking = true;
    try {
      const move = AI.getBestMove(this.board, this.settings.diff, this.settings.careerLevel ?? null);
      if (move) this.executeMove(move);
    } finally {
      this.aiThinking = false;
    }
  },

  undo() {
    // A finished Career match is committed when the last move awards progress.
    // Prevent an Undo during the brief result delay from reopening that match.
    if (this.gameOver || this.paused || this.historyStack.length === 0 || this.aiThinking ||
        (this.settings.careerLevel && (this.board?.isGameOver() || this.careerUndosUsed >= 1))) return;
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
    this.moveLog.length = index;
    if (this.settings.careerLevel) this.careerUndosUsed++;
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
    if (this.gameOver || this.paused || !this.board.isGameOver()) return;
    this.cancelPendingAction();
    this.gameOver = true;
    audio.win();
    Native.vibrate('heavy');
    const s = this.board.score;
    document.getElementById('result-title').textContent =
      s[CONSTANTS.X] > s[CONSTANTS.O]
        ? 'Victory'
        : s[CONSTANTS.O] > s[CONSTANTS.X]
          ? 'Game Over'
          : 'Draw';
    document.getElementById('result-score').textContent =
      `${s[CONSTANTS.X]} - ${s[CONSTANTS.O]}`;
    const reward = document.getElementById('career-reward');
    const nextButton = document.getElementById('nextCareerBtn');
    const stars = document.getElementById('result-stars');
    if (stars) {
      const earned = this.careerOutcome?.awardedStars || 0;
      stars.hidden = !this.settings.careerLevel || !this.careerOutcome?.victory;
      stars.textContent = '★'.repeat(earned);
      stars.style?.setProperty('--stars', String(earned));
    }
    if (nextButton) nextButton.hidden = true;
    if (reward && this.settings.careerLevel) {
      const outcome = this.careerOutcome || { status: 'unavailable' };
      reward.hidden = false;
      if (outcome.status === 'ready') {
        if (nextButton && outcome.victory && outcome.profile.unlockedLevel > this.settings.careerLevel) {
          const stage = careerLevel(this.settings.careerLevel + 1);
          const title = document.getElementById('next-career-title');
          const mission = missionFor(stage.level);
          if (title) title.textContent = mission?.title ?? 'Level ' + stage.level;
          document.getElementById('next-level-label').textContent = 'Up next · Level ' + stage.level;
          document.getElementById('next-clue').textContent = mission?.clue ?? 'Win this match to advance.';
          nextButton.textContent = 'Play level ' + stage.level;
          drawOpening(document.getElementById('next-opening'), stage);
          nextButton.hidden = false;
        }
        reward.textContent = outcome.victory
          ? `+${outcome.earnedXP} XP`
          : `Career level ${this.settings.careerLevel}: ${s[CONSTANTS.X] === s[CONSTANTS.O] ? 'Draw' : 'Try again'}`;
        if (outcome.foxUnlocked) reward.textContent += '\nAvatar unlocked: Neon Fox';
        if (outcome.newAchievements?.length) {
          reward.textContent += '\nAchievement unlocked: ' +
            outcome.newAchievements.map(item => item.title).join(', ');
        }
      } else reward.textContent = 'Career progress could not be saved. Your game result is still shown.';
    } else if (reward) { reward.hidden = true; reward.textContent = ''; }
    document.getElementById('overlay').classList.add('flex');
    this.updateUI();
    this.setSaveStatus(SaveStore.clear() ? '' : 'The finished game could not be cleared from storage.');
  },

  updateTurnStatus() {
    // This is advisory UI: never use the banner to decide whose move is legal.
    // Query lazily so existing native and test harnesses without these elements work.
    const banner = document.getElementById('turn-status');
    const label = document.getElementById('turn-label');
    const hint = document.getElementById('turn-hint');
    if (!banner || !label || !hint || !this.board) return;

    const isComputer = this.settings.mode === 'ai' && this.player === CONSTANTS.O;
    const currentName = this.player === CONSTANTS.X
      ? this.firstPlayerName
      : isComputer ? 'Computer' : 'Player 2';
    const last = this.historyStack[this.historyStack.length - 1];
    const extraTurn = last && last.player === this.player &&
      this.board.score[this.player] > last.score[this.player];

    if (banner.dataset) banner.dataset.player = this.player === CONSTANTS.X ? 'one' : 'two';
    if (this.paused) {
      label.textContent = 'Game paused';
      hint.textContent = 'Return to continue playing';
    } else if (this.gameOver || this.board.isGameOver()) {
      label.textContent = 'Round complete';
      hint.textContent = 'View the final score';
    } else if (isComputer) {
      label.textContent = extraTurn ? this.rivalName + ' gets another turn' : this.rivalName + ' thinking…';
      hint.textContent = extraTurn ? 'Square captured · Computer plays again' : 'Choosing a line';
    } else if (extraTurn) {
      label.textContent = currentName + ' gets another turn';
      hint.textContent = 'You captured a square — play again';
    } else {
      label.textContent = this.settings.mode === 'ai' ? 'Your turn' : currentName + "'s turn";
      hint.textContent = 'Tap between two dots to draw a line';
    }
  },

  doubleCaptureGoal() {
    if (!this.settings.openingVersion || this.settings.careerLevel !== 3) return null;
    return this.historyStack.some((turn, index) => {
      const after = this.historyStack[index + 1]?.score ?? this.board.score;
      return turn.player === CONSTANTS.X && after[CONSTANTS.X] - turn.score[CONSTANTS.X] === 2;
    });
  },

  updateUI() {
    const modeLabel = document.getElementById('match-mode');
    if (modeLabel) {
      const level = this.settings.careerLevel;
      if (level) {
        const radius = this.board.R;
        const playableCells = 1 + 2 * radius * (radius + 1) - 4;
        const target = threeStarTarget(playableCells);
        const earned = this.board.score[CONSTANTS.X];
        const goal = earned >= target ? '★★★ secured' : '3-star goal: ' + earned + '/' + target;
        const mission = this.settings.openingVersion && missionFor(level);
        const double = this.doubleCaptureGoal();
        const progress = double === null ? goal : double ? 'Double capture ✓' : 'Goal: double capture';
        modeLabel.textContent = 'Career · Level ' + level + '\n' + (mission?.title ?? progress);
        modeLabel.title = progress;
      } else {
        modeLabel.textContent = 'Quick Play';
        modeLabel.title = '';
      }
    }
    this.updateTurnStatus();
    this.ui.p1Score.textContent = this.board.score[CONSTANTS.X];
    this.ui.p2Score.textContent = this.board.score[CONSTANTS.O];
    if (this.gameOver || this.board.isGameOver()) {
      this.ui.p1Card.classList.remove('active');
      this.ui.p2Card.classList.remove('active');
    } else if (this.player === CONSTANTS.X) {
      this.ui.p1Card.classList.add('active');
      this.ui.p2Card.classList.remove('active');
    } else {
      this.ui.p1Card.classList.remove('active');
      this.ui.p2Card.classList.add('active');
    }

    if (this.historyStack.length > 0 &&
        !(this.settings.careerLevel && (this.board.isGameOver() || this.careerUndosUsed >= 1)))
      this.ui.undoBtn.classList.remove('disabled');
    else this.ui.undoBtn.classList.add('disabled');
    const counter = document.getElementById('undo-counter');
    if (counter) {
      counter.hidden = !this.settings.careerLevel;
      if (this.settings.careerLevel)
        counter.textContent = `Undo ${Math.max(0, 1 - this.careerUndosUsed)}/1`;
    }
    if (this.ui.undoBtn && this.settings.careerLevel) {
      const remaining = Math.max(0, 1 - this.careerUndosUsed);
      this.ui.undoBtn.title = `Career Undo: ${remaining}/1 remaining`;
      this.ui.undoBtn.setAttribute?.('aria-label', `Undo last human decision; ${remaining} of 1 remaining`);
    } else if (this.ui.undoBtn) {
      this.ui.undoBtn.title = 'Undo last move';
      this.ui.undoBtn.setAttribute?.('aria-label', 'Undo last move');
    }
  },

  loop() {
    if (this.paused || this.ui.viewGame.classList.contains('hidden')) return;
    // Safety check: Ако canvas е 0 (на пример при ротација на екран), пробај resize пак
    if (this.renderer.CELL <= 0)
      this.renderer.resize(this.ui.viewGame, this.board.S);

    this.renderer.draw(this.board, this.lastMove, this.canHumanMove() ? this.hoverMove : null);

    if (!this.gameOver || this.renderer.particles.length > 0)
      this.requestRender();
  },

  setSaveStatus(message) {
    for (const id of ['save-status', 'game-save-status']) {
      const element = document.getElementById(id);
      if (element) { element.textContent = message; element.hidden = !message; }
    }
  },

  refreshSavedGame() {
    const saved = SaveStore.read();
    const button = document.getElementById('continueBtn');
    if (button) button.hidden = saved.status !== 'ready';
    const detail = document.getElementById('continue-summary');
    if (detail) {
      const state = saved.state;
      detail.textContent = saved.status === 'ready'
        ? (state.settings.careerLevel ? 'Career · L' + state.settings.careerLevel : 'Quick Play') +
          ' · ' + state.board.score[CONSTANTS.X] + '–' + state.board.score[CONSTANTS.O]
        : '';
    }
    const messages = {
      invalid: 'The saved game could not be loaded. You can start a new game.',
      unavailable: 'Saving is unavailable. Progress may be lost when you close the game.',
    };
    this.setSaveStatus(this.saveFailed
      ? 'The latest progress could not be saved. Continue may restore an earlier move.'
      : messages[saved.status] || '');
    return saved;
  },

  resume() {
    const saved = this.refreshSavedGame();
    if (saved.status !== 'ready') return false;
    this.stop();
    audio.init();
    const state = saved.state;
    this.board = state.board;
    this.player = state.player;
    this.settings = state.settings;
    this.historyStack = state.history;
    this.moveLog = state.moves;
    this.careerOutcome = null;
    this.careerUndosUsed = state.careerUndosUsed || 0;
    this.lastMove = state.lastMove;
    this.gameOver = false;
    document.getElementById('overlay').classList.remove('flex');
    const nextButton = document.getElementById('nextCareerBtn');
    if (nextButton) nextButton.hidden = true;
    this.showBoard();
    this.saveLocal(); // Also migrates validated legacy data to the compact format.
    if (this.settings.mode === 'ai' && this.player === CONSTANTS.O) {
      this.scheduleAction(() => this.runAI(), 500);
    }
    return true;
  },

  saveLocal() {
    if (this.gameOver || !this.board) return;
    const saved = SaveStore.write(this.settings, this.moveLog, this.careerUndosUsed);
    this.saveFailed = !saved;
    this.setSaveStatus(saved ? '' : 'Could not save your latest move. Keep the game open to avoid losing progress.');
  },
};

