import './style.css';
import { missionFor, drawOpening } from './career-missions.js';
import { Game } from './game.js';
import { Native } from './native.js';
import { ProfileStore, LocalSlots, PLAYER_AVATARS, careerSummary, careerLevel } from './profile.js';
import { TUTORIAL_STEPS, tutorialStep } from './tutorial.js';
import { Renderer } from './renderer.js';
import { nearestLegalLine, canvasPoint } from './input.js';
import { duelReply, createDailyPuzzle, evaluateDailyMove, localDateKey } from './daily-challenge.js';
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

const menuPages = {
    'career-page': 'Career',
    'quick-settings': 'Quick Play settings',
    'player-settings': 'Player profile',
    'comfort-settings': 'Sound & feedback',
};
let pageTrigger = null;
function showHome() {
    el('menu-page').hidden = true;
    el('home-hub').hidden = false;
    ui.viewMenu.scrollTop = 0;
    pageTrigger?.focus();
    pageTrigger = null;
}
document.querySelectorAll('[data-page]').forEach(button => {
    button.onclick = () => {
        pageTrigger = button;
        const selected = button.dataset.page;
        if (selected === 'career-page') {
            const profile = ProfileStore.read().profile;
            if (profile) {
                careerSelect.value = String(profile.unlockedLevel);
                careerSelect.onchange();
            }
        }
        for (const id of Object.keys(menuPages)) el(id).hidden = id !== selected;
        if (selected === 'quick-settings') refreshSetupPreview();
        el('page-title').textContent = menuPages[selected];
        el('home-hub').hidden = true;
        el('menu-page').hidden = false;
        ui.viewMenu.scrollTop = 0;
        el('page-back').focus();
    };
});
el('page-back').onclick = showHome;

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
function renderRoute(profile, selected) {
    const route = el('chapter-route');
    const first = Math.floor((selected - 1) / 5) * 5 + 1;
    const nodes = [];
    for (let level = first; level < first + 5; level++) {
        const button = document.createElement('button');
        button.type = 'button';
        button.disabled = level > profile.unlockedLevel;
        button.setAttribute('aria-pressed', String(level === selected));
        const number = document.createElement('b');
        number.textContent = level;
        const title = document.createElement('span');
        title.textContent = missionFor(level)?.title ?? 'Level ' + level;
        const stars = document.createElement('small');
        stars.textContent = '★'.repeat(profile.stars[level] || 0);
        button.append(number, title, stars);
        button.onclick = () => {
            careerSelect.value = String(level);
            careerSelect.onchange();
            route.querySelector('[aria-pressed="true"]')?.focus();
        };
        nodes.push(button);
    }
    route.replaceChildren(...nodes);
}
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
    const fox = avatarSelect.querySelector?.('[value="neon-fox"]');
    if (fox) {
        fox.disabled = !p.neonFoxUnlocked;
        fox.textContent = fox.disabled ? '🔒 Neon Fox · Win level 5' : '🦊 Neon Fox';
    }
    avatarSelect.value = p.avatar;
    if (p.avatar === 'neon-fox') avatarPreview.classList.add('neon-fox');
    else avatarPreview.classList.remove('neon-fox');
    avatarPreview.textContent = PLAYER_AVATARS.find(item => item.id === p.avatar)?.icon || '✨';
    el('identity-name').textContent = p.name;
    el('identity-art').dataset.avatar = p.avatar;
    el('identity-art').textContent = ['robot','spark','fox','neon-fox'].includes(p.avatar) ? '' : avatarPreview.textContent;
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
    const mission = missionFor(p.unlockedLevel);
    el('home-level').textContent = mission ? `Level ${p.unlockedLevel} · ${mission.title}` : careerProgress.textContent;
    drawOpening(el('home-opening'), careerLevel(p.unlockedLevel));
    const selected = Number(careerSelect.value) || p.unlockedLevel;
    careerSelect.innerHTML = Array.from({ length: p.unlockedLevel }, (_, i) => {
        const n = i + 1;
        const stars = p.stars[n] ? ` · ${'★'.repeat(p.stars[n])}` : '';
        return `<option value="${n}">Level ${n}${missionFor(n) ? " · " + missionFor(n).title : ""}${stars}</option>`;
    }).join('');
    careerSelect.value = String(Math.min(selected, p.unlockedLevel));
    const stage = careerLevel(Number(careerSelect.value));
    careerDescription.textContent =
        missionFor(stage.level)?.clue ?? `Board ${stage.size} · ${stage.diff.toUpperCase()} AI · Win to unlock the next level`;
    drawOpening(el('mission-preview'), stage);
    renderRoute(p, stage.level);
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
    drawOpening(el('mission-preview'), stage);
    const profile = ProfileStore.read().profile;
    if (profile) renderRoute(profile, stage.level);
    careerDescription.textContent =
        missionFor(stage.level)?.clue ?? `Board ${stage.size} · ${stage.diff.toUpperCase()} AI · Win to unlock the next level`;
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
        refreshQuickSummary();
    });
};

let size = 6, mode = 'ai', diff = 'normal';
function refreshQuickSummary() {
    const board = { 4: 'Small', 6: 'Classic', 8: 'Large', 10: 'Grand' }[size];
    const difficulty = { easy: 'Casual', normal: 'Smart', hard: 'Master' }[diff];
    el('quick-summary').textContent = board + ' · ' + (mode === 'pvp' ? 'Two players' : difficulty + ' AI');
}
refreshQuickSummary();
const refreshSetupPreview = () => drawOpening(el('setup-preview'), { size });
setupGroup("[data-size]", b => { size = +b.dataset.size; refreshSetupPreview(); });
el('setup-play').onclick = () => el('startBtn').click();
refreshSetupPreview();
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
    if (!Game.resume() || Game.settings.careerLevel != null) return;
    ({ size, mode, diff } = Game.settings);
    refreshQuickSummary();
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
    showHome();
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
let practiceWon = false;
const updateTutorial = () => {
    const step = tutorialStep(tutorialIndex);
    el('tutorial-count').textContent = `Step ${tutorialIndex + 1} of ${TUTORIAL_STEPS.length}`;
    el('tutorial-step-title').textContent = step.title;
    el('tutorial-step-text').textContent = step.text;
    const diagram = el('tutorial-demo');
    const practice = step.diagram === 'again';
    if (diagram.dataset) diagram.dataset.phase = practice ? (practiceWon ? 'won' : 'start') : step.diagram;
    el('tutorial-play').hidden = !practice || practiceWon;
    if (practice) {
        el('tutorial-step-title').textContent = practiceWon ? 'You won 1–0!' : 'One square left. The score is 0–0.';
        el('tutorial-step-text').textContent = practiceWon
            ? 'You closed the final square and earned the deciding point.'
            : 'Play the last dotted side to capture the square.';
    }
    el('tutorial-back').hidden = tutorialIndex === 0;
    el('tutorial-next').textContent =
        tutorialIndex === TUTORIAL_STEPS.length - 1 ? 'Finish' : 'Next';
};
el('tutorial-play').onclick = () => {
    if (tutorialStep(tutorialIndex).diagram !== 'again' || practiceWon) return;
    practiceWon = true;
    updateTutorial();
    el('tutorial-next').focus?.();
};
el('helpBtn').onclick = () => {
    practiceWon = false;
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
        practiceWon = false;
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
let practiceRound = 0;
let practiceIndex = 0;
let dailyIndex = 0;
let duelLost = false;
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
    const diamonds = el('daily-diamonds').children || [];
    for (let i = 0; i < diamonds.length; i++) {
        diamonds[i].classList.toggle('earned', state.status === 'ready' && i < state.progress.solved);
    }
    if (state.status !== 'ready') {
        el('daily-menu-status').textContent = dailyStatusMessage(state.status);
        el('daily-open-btn').disabled = true;
        return;
    }
    el('daily-open-btn').disabled = false;
    el('daily-points').textContent = `${state.progress.brainPoints} Brain Points`;
    el('daily-menu-status').textContent = state.progress.solved === 3
        ? 'View today’s result →'
        : `${state.progress.solved} of 3 complete`;
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
    const index = practiceRound ? practiceIndex : state.progress.solved;
    dailyIndex = index;
    duelLost = false;
    dailySolved = false;
    dailyNext.hidden = true;
    dailyFeedback.textContent = '';
    dailyCanvas.hidden = index === 3;
    if (index === 3) {
        dailyPuzzle = null;
        el('daily-step').textContent = 'All 3 challenges complete';
        el('daily-title').textContent = 'Daily workout complete!';
        el('daily-instruction').textContent = practiceRound ? 'Practice complete. Play a fresh set whenever you like.' :
            `+30 Brain Points today · ${state.progress.brainPoints} total`;
        dailyNext.hidden = false;
        dailyNext.textContent = 'New practice set';
        return;
    }
    dailyPuzzle = createDailyPuzzle(dailyDate, index, practiceRound);
    el('daily-step').textContent = `Challenge ${index + 1} of 3`;
    el('daily-title').textContent = dailyPuzzle.title;
    if (practiceRound) el('daily-step').textContent = `Practice · ${index + 1} of 3`;
    el('daily-instruction').textContent = dailyPuzzle.difficulty + ' · ' + dailyPuzzle.instruction;
    drawDaily();
};

el('daily-open-btn').onclick = () => {
    practiceRound = 0;
    dailyDate = localDateKey();
    dailyModal.hidden = false;
    showDaily();
};
el('daily-close-btn').onclick = closeDaily;
dailyNext.onclick = () => {
    if (dailyIndex === 3) {
        practiceRound = practiceRound ? practiceRound + 1 : 1 + Math.floor(Math.random() * 1000000);
        practiceIndex = 0;
    } else if (!dailySolved && !duelLost) return;
    else if (dailySolved && practiceRound) practiceIndex++;
    showDaily();
};
dailyCanvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || !dailyPuzzle ||
        dailySolved || duelLost || dailyModal.hidden) return;
    event.preventDefault();
    const point = canvasPoint(dailyCanvas, event.clientX, event.clientY);
    if (!point) return;
    const move = nearestLegalLine(dailyPuzzle.board, dailyRenderer.CELL,
        dailyRenderer.offX, dailyRenderer.offY, point.x, point.y);
    if (!move) {
        dailyFeedback.textContent = 'Tap closer to the middle of a dotted line.';
        return;
    }
    const board = dailyPuzzle.board;
    if (dailyPuzzle.type === 'duel') {
        const human = board.makeMove(move.t, move.r, move.c, 1);
        let lastMove = move;
        if (!human.points) {
            while (!board.isGameOver()) {
                lastMove = duelReply(board);
                if (!board.makeMove(lastMove.t, lastMove.r, lastMove.c, 0).points) break;
            }
        }
        dailyRenderer.draw(board, lastMove);
        const score = `You ${board.score[1]} · Computer ${board.score[0]}`;
        if (!board.isGameOver()) {
            dailyFeedback.textContent = score + (human.points ? ' · Capture! Play again.' : ' · Your turn.');
            return;
        }
        if (board.score[1] <= board.score[0]) {
            duelLost = true;
            dailyFeedback.textContent = score + ' · ' + dailyPuzzle.retry;
            dailyNext.textContent = 'Retry duel';
            dailyNext.hidden = false;
            return;
        }
        dailyFeedback.textContent = score + ' · ' + dailyPuzzle.success;
    } else {
        if (!evaluateDailyMove(dailyPuzzle, move).correct) {
            dailyFeedback.textContent = dailyPuzzle.retry;
            return;
        }
        board.makeMove(move.t, move.r, move.c, 1);
        dailyRenderer.draw(board, move);
        dailyFeedback.textContent = dailyPuzzle.success;
    }
    if (!practiceRound) {
        const progress = DailyProgress.recordSolved(dailyDate, dailyIndex);
        if (progress.status !== 'ready') {
            showDaily();
            dailyFeedback.textContent = dailyStatusMessage(progress.status);
            return;
        }
        if (dailyIndex === 2) dailyFeedback.textContent += ' +30 Brain Points for today!';
    }
    dailySolved = true;
    dailyNext.textContent = dailyIndex === 2 ? 'See Your Result' : 'Next Challenge';
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
    } else if (pageTrigger) {
        showHome();
    } else {
        confirmDialog.open({
            heading: 'Exit RombMaster?',
            detail: 'Close the game and return to your phone?',
            confirmLabel: 'Yes, exit', cancelLabel: 'No, stay',
            onConfirm: () => Native.exit(),
        });
    }
});

