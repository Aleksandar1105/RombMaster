import './style.css';
import { Game } from './game.js';
import { Native } from './native.js';
import { ProfileStore, careerLevel } from './profile.js';

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

// Career mode is optional and offline-first. Quick Play remains available.
const profileName = el('profile-name');
const profileFeedback = el('profile-feedback');
const careerProgress = el('career-progress');
const careerXP = el('career-xp');
const careerSelect = el('career-level');
const careerDescription = el('career-description');
const careerStatus = el('career-status');
const refreshCareer = () => {
    const state = ProfileStore.read();
    if (state.status === 'invalid' || state.status === 'unavailable') {
        profileFeedback.textContent = state.status === 'invalid'
            ? 'Profile data could not be read. Reset only if you want to replace it.'
            : 'Profile storage is unavailable. Career progress cannot be saved.';
        el('career-start-btn').disabled = true;
        return;
    }
    const p = state.profile;
    el('career-start-btn').disabled = false;
    profileName.value = p.name;
    careerXP.textContent = `${p.xp} XP`;
    careerProgress.textContent = `Level ${p.unlockedLevel} / 30`;
    const selected = Number(careerSelect.value) || p.unlockedLevel;
    careerSelect.innerHTML = Array.from({ length: p.unlockedLevel }, (_, i) => {
        const n = i + 1;
        const stars = p.stars[n] ? ` · ${'★'.repeat(p.stars[n])}` : '';
        return `<option value="${n}">Level ${n}${stars}</option>`;
    }).join('');
    careerSelect.value = String(Math.min(selected, p.unlockedLevel));
    const stage = careerLevel(Number(careerSelect.value));
    careerDescription.textContent =
        `Board ${stage.size} · ${stage.diff.toUpperCase()} AI · Win to unlock the next level`;
    profileFeedback.textContent = '';
};
refreshCareer();
el('save-profile-btn').onclick = () => {
    const state = ProfileStore.saveName(profileName.value);
    if (state.status === 'bad-name') {
        profileFeedback.textContent = 'Choose a name of 1–18 characters.';
    } else if (state.status === 'ready') {
        refreshCareer();
        profileFeedback.textContent = 'Name saved on this device.';
    } else {
        profileFeedback.textContent = 'Could not save. Existing profile data was preserved.';
    }
};
careerSelect.onchange = () => {
    const stage = careerLevel(Number(careerSelect.value));
    careerDescription.textContent =
        `Board ${stage.size} · ${stage.diff.toUpperCase()} AI · Win to unlock the next level`;
};
el('career-start-btn').onclick = () => {
    const level = Number(careerSelect.value);
    const state = ProfileStore.read();
    if (!['ready', 'empty'].includes(state.status) ||
        !Number.isInteger(level) || level < 1 || level > state.profile.unlockedLevel) {
        careerStatus.textContent = 'This career level is not available.';
        return;
    }
    const saved = Game.refreshSavedGame();
    if (['ready', 'invalid'].includes(saved.status) &&
        !window.confirm('Start Career and replace the saved game?')) return;
    const stage = careerLevel(level);
    careerStatus.textContent = Game.start(stage.size, 'ai', stage.diff, level)
        ? '' : 'Could not start career level.';
};

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
    Game.start(settings.size, settings.mode, settings.diff, settings.careerLevel ?? null);
};
el('menuBtn').onclick = () => {
    Game.saveLocal();
    Game.stop();
    ui.viewGame.classList.add('hidden'); ui.viewGame.classList.remove('active-view');
    ui.viewMenu.classList.remove('hidden'); ui.viewMenu.classList.add('active-view');
    Game.refreshSavedGame();
    refreshCareer();
};

// Копче "Play Again"
el('againBtn').onclick = () => {
    // 1. Скриј го прозорецот за победа
    el('overlay').classList.remove('flex');
    // 2. Рестартирај ја играта со истите подесувања
    const settings = Game.settings;
    Game.start(settings.size, settings.mode, settings.diff, settings.careerLevel ?? null);
};

el('nextCareerBtn').onclick = () => {
    const current = Game.settings.careerLevel;
    if (!current) return;
    const state = ProfileStore.read();
    if (state.status !== 'ready' || state.profile.unlockedLevel <= current) return;
    const next = careerLevel(current + 1);
    if (Game.start(next.size, 'ai', next.diff, next.level)) {
        careerSelect.value = String(next.level);
    }
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

// Visibility and native state may arrive in either order. Both must be active
// before gameplay resumes, so duplicate events cannot queue extra AI responses.
document.addEventListener('visibilitychange', () => Game.setActive('visibility', !document.hidden));
window.addEventListener('pagehide', () => Game.setActive('page', false));
window.addEventListener('pageshow', () => Game.setActive('page', true));
Native.onStateChange(({ isActive }) => Game.setActive('native', isActive));
Game.setActive('visibility', !document.hidden);

Native.onBack(() => {
    if (el('help-modal').classList.contains('flex')) {
        el('closeHelpBtn').click();
    } else if (el('overlay').classList.contains('flex')) {
        el('overlay').classList.remove('flex');
    } else if (!ui.viewGame.classList.contains('hidden')) {
        el('menuBtn').click();
    } else {
        Native.exit();
    }
});
