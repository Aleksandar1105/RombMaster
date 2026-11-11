import './style.css';
import { Game } from './game.js';
import { Native } from './native.js';
import { ProfileStore, LocalSlots, PLAYER_AVATARS, careerSummary, careerLevel } from './profile.js';
import { TUTORIAL_STEPS, tutorialStep } from './tutorial.js';
import { Renderer } from './renderer.js';
import { nearestLegalLine, canvasPoint } from './input.js';
import { createDailyPuzzle, evaluateDailyMove, localDateKey } from './daily-challenge.js';
import { DailyProgress } from './daily-progress.js';
import { createConfirmationController } from './confirmation.js';

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

// A single custom confirmation overlays the game/menu and suspends any active
// AI timer until the user chooses; no browser-native confirm dialogs.
const confirmDialog = createConfirmationController({
    modal: el('confirm-dialog'),
    title: el('confirm-dialog-title'),
    message: el('confirm-dialog-message'),
    acceptButton: el('confirm-dialog-accept'),
    cancelButton: el('confirm-dialog-cancel'),
    documentRef: document,
    onVisibilityChange: open => Game.setActive('confirmation', !open),
});
const askBeforeReplacing = (heading, detail, onConfirm, sourceButton) => {
    const saved = Game.refreshSavedGame();
    // Treat unreadable storage as an explicit stop, not permission to erase.
    if (saved.status === 'unavailable') {
        Game.setSaveStatus('Saved-game storage is unavailable. Nothing was replaced.');
        return;
    }
    if (['ready', 'invalid', 'finished'].includes(saved.status)) {
        confirmDialog.open({
            heading, detail, confirmLabel: 'Replace Game',
            onConfirm, focusReturn: sourceButton,
        });
    } else onConfirm();
};

// Career mode is optional and offline-first. Quick Play remains available.
const profileName = el('profile-name');
const profileFeedback = el('profile-feedback');
const careerProgress = el('career-progress');
const careerXP = el('career-xp');
const careerSelect = el('career-level');
const careerDescription = el('career-description');
const careerStatus = el('career-status');
const avatarSelect = el('profile-avatar');
const avatarPreview = el('profile-avatar-preview');
const refreshCareer = () => {
    const state = ProfileStore.read();
    if (state.status === 'invalid' || state.status === 'unavailable') {
        profileFeedback.textContent = state.status === 'invalid'
            ? 'Profile data could not be read. Reset only if you want to replace it.'
            : 'Profile storage is unavailable. Career progress cannot be saved.';
        el('career-start-btn').disabled = true;
        el('reset-career-btn').disabled = true;
        return;
    }
    const p = state.profile;
    el('career-start-btn').disabled = false;
    el('reset-career-btn').disabled = false;
    profileName.value = p.name;
    avatarSelect.value = p.avatar;
    avatarPreview.textContent = PLAYER_AVATARS.find(item => item.id === p.avatar)?.icon || '✨';
    const summary = careerSummary(p);
    for (const [id, value] of Object.entries({
        'stat-played': summary.played,
        'stat-wins': summary.wins,
        'stat-draws': summary.draws,
        'stat-losses': summary.losses,
        'stat-win-rate': `${summary.winRate}%`,
        'stat-best-streak': summary.bestStreak,
        'stat-cleared': `${summary.clearedLevels} / 30`,
        'stat-stars': `${summary.totalStars} / 90`,
    })) el(id).textContent = String(value);
    el('achievement-count').textContent =
        `${summary.earnedAchievements} / ${summary.achievements.length}`;
    const achievementList = el('achievement-list');
    // Create plain text nodes, never inject player names or remote HTML.
    achievementList.replaceChildren?.();
    if (typeof document.createElement === 'function' && achievementList.appendChild) {
        for (const achievement of summary.achievements) {
            const li = document.createElement('li');
            li.className = achievement.earned ? 'earned' : 'locked';
            li.textContent =
                `${achievement.earned ? '🏆' : '🔒'} ${achievement.title} — ${achievement.description}`;
            achievementList.appendChild(li);
        }
    }
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
// Keep DOM names escaped: profile names are user-controlled plain text.
const htmlText = str => String(str).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
const localPlayerSelect = el('local-player-select');
const localPlayerFeedback = el('local-player-feedback');
const newLocalPlayerName = el('new-local-player-name');
const refreshPlayerChooser = () => {
    const slots = LocalSlots.read();
    if (slots.status !== 'ready') {
        localPlayerFeedback.textContent = 'Local player data cannot be read. No profiles were changed.';
        localPlayerSelect.disabled = true;
        el('create-local-player-btn').disabled = true;
        return;
    }
    localPlayerSelect.disabled = false;
    el('create-local-player-btn').disabled = slots.index.slots.length >= 4;
    localPlayerSelect.innerHTML = slots.index.slots.map(id => {
        const p = ProfileStore.readSlot(id);
        const label = p.status === 'ready' || p.status === 'empty'
            ? p.profile.name : 'Unreadable player';
        return `<option value="${id}">${htmlText(label)}${id === 'guest' ? ' (Guest)' : ''}</option>`;
    }).join('');
    localPlayerSelect.value = slots.index.activeId;
};
const updateActivePlayerView = () => {
    Game.stop();
    // A stopped board from the previous player must not be autosaved under
    // the newly selected player on background/pause lifecycle events.
    Game.board = null;
    Game.refreshSavedGame();
    careerSelect.value = '1';
    refreshPlayerChooser();
    refreshCareer();
    refreshDailyMenu();
};
localPlayerSelect.onchange = () => {
    const original = LocalSlots.read();
    if (original.status !== 'ready' || !ui.viewGame.classList.contains('hidden') ||
        !dailyModal.hidden) {
        refreshPlayerChooser();
        localPlayerFeedback.textContent = 'Return to the menu and close challenges before switching.';
        return;
    }
    const result = LocalSlots.switchTo(localPlayerSelect.value);
    if (result.status !== 'ready') {
        refreshPlayerChooser();
        localPlayerFeedback.textContent = 'Could not switch player. Existing data was left untouched.';
        return;
    }
    updateActivePlayerView();
    localPlayerFeedback.textContent = 'Switched to the selected local player.';
};
el('create-local-player-btn').onclick = () => {
    if (!ui.viewGame.classList.contains('hidden') || !dailyModal.hidden) {
        localPlayerFeedback.textContent = 'Close the current game or challenge before creating a player.';
        return;
    }
    const result = LocalSlots.createPlayer(newLocalPlayerName.value);
    if (result.status !== 'ready') {
        localPlayerFeedback.textContent = ({
            'bad-name': 'Enter a player name of 1–18 characters.',
            limit: 'Maximum of four local players reached.',
            'duplicate-name': 'Choose a different player name.',
            invalid: 'Existing player data could not be read and was preserved.',
        })[result.status] || 'Unable to add player; existing data was preserved.';
        return;
    }
    newLocalPlayerName.value = '';
    updateActivePlayerView();
    localPlayerFeedback.textContent = 'New local player created with separate progress.';
};
refreshPlayerChooser();
refreshCareer();

// Offline-only player comfort settings. Storage failures never block gameplay.
const soundToggle = el('sound-toggle');
const hapticsToggle = el('haptics-toggle');
const comfortStatus = el('comfort-status');
const comfortKey = 'rombmaster.comfort.v1';
const readComfort = () => {
    try {
        const stored = localStorage.getItem(comfortKey);
        if (!stored) return { sound: true, haptics: true };
        const parsed = JSON.parse(stored);
        return {
            sound: typeof parsed.sound === 'boolean' ? parsed.sound : true,
            haptics: typeof parsed.haptics === 'boolean' ? parsed.haptics : true,
        };
    } catch {
        comfortStatus.textContent = 'Preferences are using defaults on this device.';
        return { sound: true, haptics: true };
    }
};
const setComfort = (settings, persist = false) => {
    soundToggle.checked = settings.sound;
    hapticsToggle.checked = settings.haptics;
    Game.setSoundEnabled(settings.sound);
    Native.setHapticsEnabled(settings.haptics);
    if (!persist) return;
    try {
        localStorage.setItem(comfortKey, JSON.stringify(settings));
        comfortStatus.textContent = '';
    } catch {
        comfortStatus.textContent = 'The setting works for this session but could not be saved.';
    }
};
setComfort(readComfort());
soundToggle.onchange = () => setComfort({ sound: soundToggle.checked, haptics: hapticsToggle.checked }, true);
hapticsToggle.onchange = () => setComfort({ sound: soundToggle.checked, haptics: hapticsToggle.checked }, true);

// The explicit in-game confirmation protects against accidental Career data loss.
// A saved Career match must be resolved first, so it cannot later re-award
// progression to a reset profile. Unknown saves are never destroyed.
const careerResetModal = el('career-reset-modal');
careerResetModal.hidden = true;
const closeCareerReset = () => { careerResetModal.hidden = true; };
el('reset-career-btn').onclick = () => {
    const profile = ProfileStore.read();
    if (!['empty', 'ready'].includes(profile.status)) {
        profileFeedback.textContent = 'Career reset is unavailable while profile data cannot be read.';
        return;
    }
    const saved = Game.refreshSavedGame();
    if (saved.status === 'invalid' || saved.status === 'unavailable' ||
        (['ready', 'finished'].includes(saved.status) && saved.state.settings.careerLevel)) {
        profileFeedback.textContent =
            'Resolve the saved Career game or unreadable save before resetting Career progress.';
        return;
    }
    careerResetModal.hidden = false;
    el('career-reset-cancel').focus?.();
};
el('career-reset-cancel').onclick = closeCareerReset;
el('career-reset-confirm').onclick = () => {
    // Revalidate the save immediately before writing to avoid stale UI state.
    const saved = Game.refreshSavedGame();
    if (saved.status === 'invalid' || saved.status === 'unavailable' ||
        (['ready', 'finished'].includes(saved.status) && saved.state.settings.careerLevel)) {
        closeCareerReset();
        profileFeedback.textContent = 'Reset stopped: saved Career game must be resolved first.';
        return;
    }
    const result = ProfileStore.resetCareer();
    closeCareerReset();
    if (result.status !== 'ready') {
        profileFeedback.textContent = 'Reset failed. Existing progress was preserved where possible.';
        return;
    }
    // Choose the newly unlocked first stage and repaint local-only statistics.
    careerSelect.value = '1';
    refreshCareer();
    profileFeedback.textContent = 'Career restarted at Level 1. Name, avatar and other modes were kept.';
};
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
avatarSelect.onchange = () => {
    const state = ProfileStore.saveAvatar(avatarSelect.value);
    if (state.status === 'ready') {
        refreshCareer();
        profileFeedback.textContent = 'Avatar saved on this device.';
    } else {
        profileFeedback.textContent = 'Could not save avatar; profile unchanged.';
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
    const activeId = LocalSlots.read().index?.activeId;
    const startCareer = () => {
        if (LocalSlots.read().index?.activeId !== activeId) return;
        const updated = ProfileStore.read();
        if (!['ready', 'empty'].includes(updated.status) || level > updated.profile.unlockedLevel) {
            careerStatus.textContent = 'Career level is no longer available.';
            return;
        }
        const stage = careerLevel(level);
        careerStatus.textContent = Game.start(stage.size, 'ai', stage.diff, level)
            ? '' : 'Could not start career level.';
    };
    askBeforeReplacing('Start Career?', 'This will replace your current saved match for this player. Career progress already earned remains safe.', startCareer, el('career-start-btn'));
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
    const requested = { size, mode, diff };
    const activeId = LocalSlots.read().index?.activeId;
    const startNew = () => {
        if (LocalSlots.read().index?.activeId !== activeId) return;
        Game.start(requested.size, requested.mode, requested.diff);
    };
    askBeforeReplacing('Start New Game?', 'Your currently saved match for this player will be replaced. Career XP and Daily Brain Points stay safe.', startNew, el('startBtn'));
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
    const settings = { ...Game.settings };
    const activeId = LocalSlots.read().index?.activeId;
    const restart = () => {
        if (LocalSlots.read().index?.activeId !== activeId) return;
        Game.start(settings.size, settings.mode, settings.diff, settings.careerLevel ?? null);
    };
    if (Game.historyStack.length) {
        confirmDialog.open({
            heading: 'Restart This Game?',
            detail: 'All moves in this unfinished match will be lost. Your earned Career progress and Daily Brain Points will stay safe.',
            confirmLabel: 'Restart Game', onConfirm: restart, focusReturn: el('restartBtn'),
        });
    } else restart();
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

// Self-contained tutorial: no Board moves, career XP or save data are modified.
let tutorialIndex = 0;
const updateTutorial = () => {
    const step = tutorialStep(tutorialIndex);
    el('tutorial-count').textContent = `Step ${tutorialIndex + 1} of ${TUTORIAL_STEPS.length}`;
    el('tutorial-step-title').textContent = step.title;
    el('tutorial-step-text').textContent = step.text;
    const diagram = el('tutorial-demo');
    if (diagram.dataset) diagram.dataset.phase = step.diagram;
    el('tutorial-back').hidden = tutorialIndex === 0;
    el('tutorial-next').textContent =
        tutorialIndex === TUTORIAL_STEPS.length - 1 ? 'Finish' : 'Next';
};
el('helpBtn').onclick = () => {
    tutorialIndex = 0;
    updateTutorial();
    el('help-modal').classList.add('flex');
};
el('tutorial-next').onclick = () => {
    if (tutorialIndex < TUTORIAL_STEPS.length - 1) {
        tutorialIndex++;
        updateTutorial();
    } else el('closeHelpBtn').click();
};
el('tutorial-back').onclick = () => {
    if (tutorialIndex > 0) {
        tutorialIndex--;
        updateTutorial();
    }
};
el('closeHelpBtn').onclick = () => el('help-modal').classList.remove('flex');

// Daily practice is entirely independent of the currently saved match.
// One deterministic challenge set per device-local date. No timer or FOMO gate.
const dailyCanvas = el('daily-canvas');
const dailyRenderer = new Renderer(dailyCanvas);
let dailyPuzzle = null;
let dailyDate = null;
let dailySolved = false;
const dailyModal = el('daily-modal');
dailyModal.hidden = true; // Explicit initial state, including minimal DOM test harnesses.
const dailyNext = el('daily-next-btn');
const dailyFeedback = el('daily-feedback');
const dailyStatusMessage = status => ({
    invalid: 'Saved daily progress could not be read. It was preserved.',
    unavailable: 'Daily progress storage is unavailable. Nothing was changed.',
    'clock-changed': 'Device date changed backwards. Restore the date to continue.',
})[status] || 'Daily challenge unavailable.';

const refreshDailyMenu = () => {
    const state = DailyProgress.read(localDateKey());
    if (state.status !== 'ready') {
        el('daily-menu-status').textContent = dailyStatusMessage(state.status);
        el('daily-open-btn').disabled = true;
        return;
    }
    el('daily-open-btn').disabled = false;
    el('daily-points').textContent = `${state.progress.brainPoints} Brain Points`;
    el('daily-menu-status').textContent = state.progress.solved === 3
        ? 'Completed today! Come back whenever you like.'
        : `${state.progress.solved} of 3 tactics completed today`;
};

const drawDaily = () => {
    if (!dailyPuzzle) return;
    const width = Math.min(window.innerWidth - 20, 420);
    dailyRenderer.resize({
        clientWidth: width, clientHeight: Math.max(400, Math.min(window.innerHeight, 640)),
        querySelector: () => null,
    }, dailyPuzzle.board.S);
    dailyRenderer.draw(dailyPuzzle.board, null);
};

const closeDaily = () => {
    dailyModal.hidden = true;
    dailyPuzzle = null;
    dailySolved = false;
    refreshDailyMenu();
};

const showDaily = () => {
    const state = DailyProgress.read(dailyDate);
    if (state.status !== 'ready') {
        dailyPuzzle = null;
        el('daily-step').textContent = 'Progress unavailable';
        el('daily-title').textContent = 'Daily Brain Challenge';
        el('daily-instruction').textContent = dailyStatusMessage(state.status);
        dailyCanvas.hidden = true;
        dailyNext.hidden = true;
        return;
    }
    const index = state.progress.solved;
    dailySolved = false;
    dailyNext.hidden = true;
    dailyFeedback.textContent = '';
    dailyCanvas.hidden = index === 3;
    if (index === 3) {
        dailyPuzzle = null;
        el('daily-step').textContent = 'All 3 challenges complete';
        el('daily-title').textContent = 'Daily workout complete!';
        el('daily-instruction').textContent = 'Well played! You earned 30 Brain Points. Your next workout is optional.';
        return;
    }
    dailyPuzzle = createDailyPuzzle(dailyDate, index);
    el('daily-step').textContent = `Challenge ${index + 1} of 3`;
    el('daily-title').textContent = dailyPuzzle.title;
    el('daily-instruction').textContent = dailyPuzzle.instruction;
    drawDaily();
};

el('daily-open-btn').onclick = () => {
    dailyDate = localDateKey();
    dailyModal.hidden = false;
    showDaily();
};
el('daily-close-btn').onclick = closeDaily;
dailyNext.onclick = () => {
    if (!dailySolved) return;
    showDaily();
};
dailyCanvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || !dailyPuzzle ||
        dailySolved || dailyModal.hidden) return;
    event.preventDefault();
    const point = canvasPoint(dailyCanvas, event.clientX, event.clientY);
    if (!point) return;
    const move = nearestLegalLine(dailyPuzzle.board, dailyRenderer.CELL,
        dailyRenderer.offX, dailyRenderer.offY, point.x, point.y);
    if (!move) {
        dailyFeedback.textContent = 'Tap closer to the middle of a dotted line.';
        return;
    }
    const check = evaluateDailyMove(dailyPuzzle, move);
    if (!check.correct) {
        dailyFeedback.textContent = dailyPuzzle.retry;
        return;
    }
    const progress = DailyProgress.recordSolved(dailyDate,
        DailyProgress.read(dailyDate).progress?.solved);
    if (progress.status !== 'ready') {
        dailyFeedback.textContent = dailyStatusMessage(progress.status);
        return;
    }
    dailySolved = true;
    dailyPuzzle.board.makeMove(move.t, move.r, move.c, 1);
    dailyRenderer.draw(dailyPuzzle.board, move);
    dailyFeedback.textContent = dailyPuzzle.success +
        (progress.progress.solved === 3 ? ' +30 Brain Points for today!' : '');
    dailyNext.textContent = progress.progress.solved === 3 ? 'See Your Result' : 'Next Challenge';
    dailyNext.hidden = false;
    refreshDailyMenu();
});
window.addEventListener('resize', () => {
    if (!dailyModal.hidden && dailyPuzzle) drawDaily();
});
refreshDailyMenu();

// Visibility and native state may arrive in either order. Both must be active
// before gameplay resumes, so duplicate events cannot queue extra AI responses.
document.addEventListener('visibilitychange', () => Game.setActive('visibility', !document.hidden));
window.addEventListener('pagehide', () => Game.setActive('page', false));
window.addEventListener('pageshow', () => Game.setActive('page', true));
Native.onStateChange(({ isActive }) => Game.setActive('native', isActive));
Game.setActive('visibility', !document.hidden);

Native.onBack(() => {
    if (confirmDialog.isOpen()) {
        confirmDialog.close();
    } else if (!careerResetModal.hidden) {
        closeCareerReset();
    } else if (!dailyModal.hidden) {
        closeDaily();
    } else if (el('help-modal').classList.contains('flex')) {
        el('closeHelpBtn').click();
    } else if (el('overlay').classList.contains('flex')) {
        el('overlay').classList.remove('flex');
    } else if (!ui.viewGame.classList.contains('hidden')) {
        el('menuBtn').click();
    } else {
        Native.exit();
    }
});
