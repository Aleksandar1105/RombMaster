import './style.css';
import { Game } from './game.js';
import { Native } from './native.js';

// Elements
const el = id => document.getElementById(id);
const ui = {
    viewMenu: el('view-menu'),
    viewGame: el('view-game'),
    p1Card: el('p1-card'), p2Card: el('p2-card'),
    p1Score: el('p1-score'), p2Score: el('p2-score'),
    undoBtn: el('undoBtn')
};

// Init
Game.init(el('canvas'), ui);
Game.refreshSavedGame();

// Inputs
const setupGroup = (sel, cb) => {
    document.querySelectorAll(sel).forEach(b => b.onclick = () => {
        document.querySelectorAll(sel).forEach(x => x.classList.remove("selected"));
        b.classList.add("selected"); cb(b);
    });
};

let size = 6, mode = 'ai', diff = 'normal';
setupGroup("[data-size]", b => size = +b.dataset.size);
setupGroup("[data-ai]", b => {
    mode = b.dataset.ai;
    el('difficulty-wrapper').style.opacity = mode === 'pvp' ? '0.3' : '1';
    el('difficulty-wrapper').style.pointerEvents = mode === 'pvp' ? 'none' : 'auto';
});
setupGroup("[data-diff]", b => diff = b.dataset.diff);

el('startBtn').onclick = () => {
    const saved = Game.refreshSavedGame();
    if (['ready', 'invalid'].includes(saved.status) &&
        !window.confirm('Start a new game and replace the saved game?')) return;
    Game.start(size, mode, diff);
};
el('continueBtn').onclick = () => {
    if (!Game.resume()) return;
    ({ size, mode, diff } = Game.settings);
    for (const [key, value] of [['size', size], ['ai', mode], ['diff', diff]]) {
        document.querySelectorAll(`[data-${key}]`).forEach(button => {
            if (button.dataset[key] === String(value)) button.classList.add('selected');
            else button.classList.remove('selected');
        });
    }
    el('difficulty-wrapper').style.opacity = mode === 'pvp' ? '0.3' : '1';
    el('difficulty-wrapper').style.pointerEvents = mode === 'pvp' ? 'none' : 'auto';
};
el('undoBtn').onclick = () => Game.undo();
el('restartBtn').onclick = () => {
    if (Game.historyStack.length && !window.confirm('Restart this game and discard its progress?')) return;
    const settings = Game.settings;
    Game.start(settings.size, settings.mode, settings.diff);
};
el('menuBtn').onclick = () => {
    Game.saveLocal();
    Game.stop();
    ui.viewGame.classList.add('hidden'); ui.viewGame.classList.remove('active-view');
    ui.viewMenu.classList.remove('hidden'); ui.viewMenu.classList.add('active-view');
    Game.refreshSavedGame();
};

// Копче "Play Again"
el('againBtn').onclick = () => {
    // 1. Скриј го прозорецот за победа
    el('overlay').classList.remove('flex');
    // 2. Рестартирај ја играта со истите подесувања
    const settings = Game.settings;
    Game.start(settings.size, settings.mode, settings.diff);
};

// Копче "Main Menu" (од прозорецот за победа)
el('backMenuBtn').onclick = () => {
    // 1. Скриј го прозорецот за победа
    el('overlay').classList.remove('flex');
    // 2. Искористи ја веќе постоечката логика за враќање во мени
    el('menuBtn').click();
};

el('helpBtn').onclick = () => el('help-modal').classList.add('flex');
el('closeHelpBtn').onclick = () => el('help-modal').classList.remove('flex');

// Native Back Button Handling
Native.onBack(({ canGoBack }) => {
    if (!ui.viewGame.classList.contains('hidden')) {
        el('menuBtn').click();
    } else {
        // Exit app if on main menu (Android default behavior for last screen)
        // navigator.app.exitApp(); implied by not handling it
    }
});
