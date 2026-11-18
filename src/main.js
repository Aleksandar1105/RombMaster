import './style.css';
import './skin-store-compact.css';
import { mountArcade } from './arcade-ui.js';
import { missionFor, drawOpening } from './career-missions.js';
import { Game } from './game.js';
import { Native } from './native.js';
import { ProfileStore, LocalSlots, PLAYER_AVATARS, careerSummary, careerLevel, CAREER_LEVEL_COUNT, careerWorld, CAREER_WORLDS } from './profile.js';
import { TUTORIAL_STEPS, tutorialStep } from './tutorial.js';
import { Renderer } from './renderer.js';
import { Board } from './board.js';
import { SKINS, SKIN_KEY, getSkin, activeSkin, setActiveSkin, unlockedSkin, readSkin, saveSkin, skinCatalog, seasonalCatalog, seasonStatus, seasonalPriceLabel } from './skins.js';
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

const arcade=mountArcade({game:Game});
const menuPages = {
    'career-page': 'Career',
    'quick-settings': 'Quick Play',
    'player-settings': 'Player profile',
    'comfort-settings': 'Sound & feedback',
    'skin-page': 'Skin Store',
    ...(el('arcade-page')?{'arcade-page':'Challenge Arena'}:{}),
};
let pageTrigger = null;
function showHome() {
    readQuickSetup();
    renderQuickSetup();
    arcade?.leave();
    stopSkinPreview();
    skinDetailsOpen = false;
    el('page-back').textContent = '← Home';
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
        if(selected!=='arcade-page')arcade?.leave();
        if (selected !== 'skin-page') stopSkinPreview();
        if (selected === 'career-page') {
            const state = ProfileStore.read();
            const profile = state.profile;
            el('career-identity').hidden = state.status !== 'empty';
            if (state.status === 'empty') {
                el('career-name').value = profile.name;
                el('career-avatar').value = profile.avatar;
                el('identity-status').textContent = '';
            }
            refreshCareerSkins();
            if (profile) {
                careerSelect.value = String(profile.unlockedLevel);
                careerSelect.onchange();
            }
        }
        for (const id of Object.keys(menuPages)) el(id).hidden = id !== selected;
        if (selected === 'quick-settings') {
            readQuickSetup();
            if (button.id === 'home-two-players') mode = 'pvp';
            renderQuickSetup();
        }
        el('page-title').textContent = menuPages[selected];
        if (selected === 'skin-page') openSkins(button.dataset.collection === 'true');
        el('home-hub').hidden = true;
        el('menu-page').hidden = false;
        ui.viewMenu.scrollTop = 0;
        if(selected==='arcade-page')arcade?.enter();
        el('page-back').focus();
    };
});
el('page-back').onclick = () => { if (!closeSkinDetails()) showHome(); };

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
    const world=careerWorld(selected);
    el('chapter-label').textContent = world.name+' · '+(Math.floor((selected-1)/5)+1)+' / '+Math.ceil(CAREER_LEVEL_COUNT/5);
    const rival=el('career-rival');
    if(rival)rival.textContent=world.icon+' '+world.rival+' · '+world.focus;
    el('previous-chapter').disabled = first === 1;
    el('next-chapter').disabled = first + 5 > profile.unlockedLevel;
    el('career-start-btn').textContent = 'Start match · Level ' + selected;
    const nodes = [];
    for (let level = first; level < first + 5; level++) {
        const button = document.createElement('button');
        button.type = 'button';
        button.disabled = level > profile.unlockedLevel;
        button.setAttribute('aria-pressed', String(level === selected));
        const number = document.createElement('b');
        number.textContent = level;
        const title = document.createElement('span');
        title.textContent = careerWorld(level)?.end===level?'Boss Battle':missionFor(level)?.title ?? 'Level ' + level;
        const stars = document.createElement('small');
        stars.textContent = button.disabled ? '🔒' : '★'.repeat(profile.stars[level] || 0);
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
// Read preferences from the current local slot, independent of saved matches.
const skinState = () => {
    const state = ProfileStore.read();
    return { profile: state.profile, daily: DailyProgress.read(localDateKey()).progress,
        key: LocalSlots.storageKey(SKIN_KEY) };
};
function applySkin(id) {
    renderSkinVariables(setActiveSkin(id));
}
function renderSkinVariables(skin) {
    const root = document.documentElement;
    if (!root) return; // headless input tests
    root.dataset.skin = skin.id;
    for (const [name,value] of Object.entries({
        '--skin-bg': skin.colors.bg, '--skin-x': skin.colors.x, '--skin-o': skin.colors.o,
        '--skin-accent': skin.accent, '--skin-ink': skin.id === 'white' ? '#182334' : '#f8fafc',
        '--skin-panel': skin.id === 'white' ? '#ffffff' : skin.colors.bg,
        '--skin-gold': skin.colors.lastMove,
        '--home-bg': skin.colors.bg,
        '--home-ink': skin.id === 'white' ? '#182334' : '#f8fafc',
    })) root.style.setProperty(name,value);
}
function syncSkin() {
    const {profile,daily,key} = skinState();
    applySkin(readSkin(localStorage,key,profile,daily));
}
let previewSkinId = 'neon';
let skinCatalogPage = 0;
let skinDetailsOpen = false;
const SKIN_PAGE_SIZE = 6;
function setSkinPanel(detail) {
    skinDetailsOpen = detail;
    el('skin-catalog-panel').hidden = detail;
    el('skin-detail-panel').hidden = !detail;
    el('page-back').textContent = detail ? '← Skins' : '← Home';
    if (detail) {
        el('page-title').textContent = 'Skin Details';
        const skin = getSkin(previewSkinId);
        const art = el('skin-detail-art');
        art.src = ['neon','royal'].includes(skin.id) ? '/assets/premium/master/' + skin.id + '-master-store.webp' : '/assets/premium/reference/' + skin.id + '-reference-hero.webp';
        art.alt = skin.name;
        el('skin-detail-description').textContent = skin.catalog.description + ' · ' + skin.catalog.rarity;
        showSkinPreview();
    } else stopSkinPreview();
    ui.viewMenu.scrollTop = 0;
}
function closeSkinDetails() {
    if (!skinDetailsOpen || el('skin-page').hidden || el('menu-page').hidden) return false;
    setSkinPanel(false);
    renderSkinCatalog();
    el('skin-options').querySelector('[data-skin-id="' + previewSkinId + '"]')?.focus({preventScroll:true});
    return true;
}
function changeSkinCatalogPage(delta) {
    skinCatalogPage += delta;
    renderSkinCatalog();
}
let homePreviewSkin = null;
let collectionOnly = false;
let seasonalOnly = false;
let skinPreviewFrame = null;
let skinPreviewRenderer = null;
let skinPreviewBoard = null;
function stopSkinPreview() {
    if (skinPreviewFrame !== null) cancelAnimationFrame(skinPreviewFrame);
    skinPreviewFrame = null;
    if (skinPreviewRenderer) skinPreviewRenderer.particles = [];
    // Only interrupt menu audio when a preview actually exists.
    if (skinPreviewRenderer) Game.stopCosmeticSound();
    skinPreviewRenderer = skinPreviewBoard = null;
    const victory=el('seasonal-victory');
    if(victory){victory.hidden=true;victory.classList.remove('playing');}
}
function showSkinPreview() {
    stopSkinPreview();
    if (!skinDetailsOpen) return;
    const skin = getSkin(previewSkinId);
    const {profile,daily} = skinState();
    const unlocked = unlockedSkin(skin.id,profile,daily);
    const canvas = el('skin-preview');
    el('skin-preview-name').textContent = skin.name;
    const stage = el('skin-stage');
    stage.dataset.previewSkin = skin.id;
    const crest=el('seasonal-crest');
    if(crest)crest.hidden=!skin.offer;
    const victoryButton=el('skin-victory-preview');
    if(victoryButton)victoryButton.hidden=!skin.catalog.victory;
    if (stage.style.setProperty) {
        for (const [name,value] of Object.entries({
            '--skin-bg':skin.colors.bg,'--skin-x':skin.colors.x,'--skin-o':skin.colors.o,
            '--skin-accent':skin.accent,'--skin-ink':skin.id === 'white' ? '#182334' : '#f8fafc',
            '--skin-panel':skin.id === 'white' ? '#ffffff' : skin.colors.bg,
            '--skin-gold':skin.colors.lastMove,
        })) stage.style.setProperty(name,value);
    }
    el('skin-equip').disabled = !unlocked || activeSkin().id === skin.id;
    el('skin-equip').textContent = activeSkin().id === skin.id ? 'Equipped' : unlocked ? 'Equip skin' : skin.id === 'royal' ? 'Coming soon' : 'Locked';
    if (skin.offer) {
        const {active,daysLeft}=seasonStatus(skin.offer);
        el('skin-equip').textContent = active ? 'Purchases coming soon' : 'Out of season';
        el('skin-status').textContent = (active ? daysLeft+' days left' : 'Season: '+skin.offer.start+' – '+skin.offer.end) + ' · Target price '+seasonalPriceLabel(skin)+' · No payment enabled';
    } else el('skin-status').textContent = skin.condition;
    el('skin-effect-label').textContent = 'Capture effect: ' + skin.catalog.effect + (skin.catalog.victory ? ' · Victory: '+skin.catalog.victory : '');
    if (canvas?.getContext?.('2d')) {
        const board = new Board(4);
        // A read-only sample with both orientations of contrasting shared edges.
        for (const [r,c,p] of [[1,2,1],[2,2,0],[2,3,1]]) {
            board.owner[r][c] = p;
            board.h[r][c] = board.h[r+1][c] = board.v[r][c] = board.v[r][c+1] = true;
        }
        const renderer = new Renderer(canvas,skin);
        renderer.CELL = (canvas.width - 16) / board.S;
        renderer.offX = renderer.offY = 8;
        renderer.draw(board,null);
        skinPreviewRenderer = renderer;
        skinPreviewBoard = board;
    }
    for (const button of el('skin-options').children) {
        button.setAttribute('aria-pressed',String(button.dataset.skinId === skin.id));
    }
}
function renderSkinCatalog() {
    const {profile,daily} = skinState();
    const entries = seasonalOnly ? seasonalCatalog() : skinCatalog(profile,daily,activeSkin().id,collectionOnly);
    const owned = skinCatalog(profile,daily,activeSkin().id,true);
    el('skin-owned-count').textContent = seasonalOnly ? entries.filter(e=>e.active).length+' seasonal offers in season · Preview all '+entries.length : owned.length + ' / ' + SKINS.length + ' skins unlocked';
    el('skin-tab-store').setAttribute('aria-pressed',String(!collectionOnly && !seasonalOnly));
    el('skin-tab-collection').setAttribute('aria-pressed',String(collectionOnly));
    el('skin-tab-seasonal')?.setAttribute('aria-pressed',String(seasonalOnly));
    el('page-title').textContent = seasonalOnly ? 'Seasonal Collection' : collectionOnly ? 'My Collection' : 'Skin Store';
    if (!entries.some(entry=>entry.skin.id===previewSkinId)) previewSkinId = entries[0]?.skin.id || activeSkin().id;
    const pageCount = Math.max(1, Math.ceil(entries.length / SKIN_PAGE_SIZE));
    skinCatalogPage = Math.max(0, Math.min(skinCatalogPage, pageCount - 1));
    el('skin-pagination').hidden = pageCount === 1;
    el('skin-page-prev').disabled = skinCatalogPage === 0;
    el('skin-page-next').disabled = skinCatalogPage >= pageCount - 1;
    el('skin-page-number').textContent = (skinCatalogPage + 1) + ' / ' + pageCount;
    const buttons = entries.slice(skinCatalogPage * SKIN_PAGE_SIZE, (skinCatalogPage + 1) * SKIN_PAGE_SIZE).map(({skin,status,owned,active}) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'skin-card';
        button.dataset.skinId = skin.id;
        button.dataset.ownership = status === 'Equipped' ? 'equipped' : owned ? 'owned' : skin.offer ? 'seasonal-preview' : 'locked';
        button.dataset.rarity = skin.catalog.rarity.toLowerCase();
        if (skin.offer) button.dataset.inSeason = String(!!active);
        button.style.setProperty('--card-x',skin.colors.x);
        button.style.setProperty('--card-o',skin.colors.o);
        button.style.setProperty('--card-accent',skin.accent);
        button.style.setProperty('--card-bg',skin.colors.bg);
        button.setAttribute('aria-label',skin.name + ', ' + skin.catalog.rarity + ', ' + status + ', preview');
        const part = (className,value) => {
            const node = document.createElement('span');
            node.className = className;
            node.textContent = value;
            return node;
        };
        button.append(part('skin-card-rarity',skin.catalog.rarity),
            part('skin-card-name',skin.name),
            part('skin-card-status',status),
            part('skin-card-action','View skin ›'));
        button.setAttribute('aria-pressed',String(skin.id === activeSkin().id));
        button.onclick = () => {
            previewSkinId = skin.id;
            setSkinPanel(true);
            el('page-back').focus({preventScroll:true});
        };
        return button;
    });
    el('skin-options').replaceChildren(...buttons);
    if (skinDetailsOpen) { el('page-title').textContent = 'Skin Details'; showSkinPreview(); }
}
function openSkins(ownedOnly = false) {
    seasonalOnly = false;
    collectionOnly = ownedOnly;
    previewSkinId = activeSkin().id;
    skinCatalogPage = 0;
    setSkinPanel(false);
    renderSkinCatalog();
}
el('skin-page-prev').onclick = () => changeSkinCatalogPage(-1);
el('skin-page-next').onclick = () => changeSkinCatalogPage(1);
el('skin-tab-store').onclick = () => { seasonalOnly=false; collectionOnly = false; skinCatalogPage=0; renderSkinCatalog(); };
el('skin-tab-collection').onclick = () => { seasonalOnly=false; collectionOnly = true; skinCatalogPage=0; renderSkinCatalog(); };
if(el('skin-tab-seasonal')) el('skin-tab-seasonal').onclick = () => { collectionOnly=false; seasonalOnly=true; skinCatalogPage=0; renderSkinCatalog(); };
el('skin-effect-preview').onclick = () => {
    if (el('skin-page').hidden || Game.paused || !skinPreviewRenderer || !skinPreviewBoard) return;
    if (skinPreviewFrame !== null) cancelAnimationFrame(skinPreviewFrame);
    skinPreviewFrame = null;
    const renderer = skinPreviewRenderer, board = skinPreviewBoard;
    renderer.particles = [];
    renderer.spawnParticles(2,2,0);
    Game.playCosmeticSound('capture',previewSkinId);
    const frame = () => {
        skinPreviewFrame = null;
        if (el('skin-page').hidden || Game.paused || renderer !== skinPreviewRenderer) return;
        renderer.draw(board,null);
        if (renderer.particles.length) skinPreviewFrame = requestAnimationFrame(frame);
    };
    frame();
};
if(el('skin-victory-preview')) el('skin-victory-preview').onclick=()=>{
    const skin=getSkin(previewSkinId), victory=el('seasonal-victory');
    if(!skin.catalog.victory || el('skin-page').hidden || Game.paused || !victory)return;
    victory.dataset.victorySkin=skin.id;
    victory.textContent='Victory · '+skin.catalog.victory;
    victory.classList.remove('playing');
    victory.hidden=false;
    void victory.offsetWidth;
    victory.classList.add('playing');
    Game.playCosmeticSound('win',skin.id);
};
el('skin-equip').onclick = () => {
    const {profile,daily,key} = skinState();
    const result = saveSkin(localStorage,key,previewSkinId,profile,daily);
    if (result !== 'ready') {
        el('skin-status').textContent = result === 'locked' ? 'This skin is locked.' : 'Could not save skin. Previous selection preserved.';
        return;
    }
    applySkin(previewSkinId);
    refreshCareer();
    renderSkinCatalog();
    el('skin-status').textContent = 'Equipped for this local player.';
};
// Portraits are cosmetic; lock state is derived from the validated profile.
function refreshRivalPortraits(profile) {
    for (const [i, world] of CAREER_WORLDS.entries()) {
        const state = profile?.stars?.[world.end] ? 'defeated' : profile && profile.unlockedLevel >= world.start ? 'available' : 'locked';
        for (const prefix of ['home-rival', 'career-rival-card']) {
            const card = el(prefix + '-' + i);
            const status = el(prefix + '-status-' + i);
            if (card) card.dataset.state = state;
            if (status) status.textContent = state === 'defeated' ? 'Defeated' : state === 'available' ? 'Available' : 'Locked';
        }
    }
}
function refreshPremiumHome(profile, summary, visualSkin = activeSkin()) {
    const panel = el('premium-home-progress');
    if (!panel) return;
    panel.hidden = !profile || !summary;
    const world = profile ? careerWorld(profile.unlockedLevel) : null;
    const skinName = el('premium-skin-name');
    if (skinName) skinName.textContent = visualSkin.name;
    const home = el('home-hub');
    if (home) home.dataset.world = world ? world.name.toLowerCase().replace(/ /g, '-') : '';
    refreshRivalPortraits(profile);
    const hero = el('premium-hero-stage');
    const gallery = el('premium-rivals-section');
    if (hero) {
        hero.hidden = panel.hidden;
        hero.dataset.world = world ? world.name.toLowerCase().replace(/ /g, '-') : '';
    }
    if (gallery) gallery.hidden = panel.hidden;
    const avatar = el('premium-player-avatar');
    if (avatar) {
        avatar.dataset.avatar = profile?.avatar ?? '';
        avatar.textContent = PLAYER_AVATARS.find(item => item.id === profile?.avatar)?.icon || '';
    }
    const rivalIcon = el('premium-rival-icon');
    if (rivalIcon) rivalIcon.dataset.rival = world?.rival.toLowerCase() ?? '';
    const heroTitle = el('premium-hero-title');
    if (heroTitle) heroTitle.textContent = world ? world.name + ' · Level ' + profile.unlockedLevel : '';
    if (!panel.hidden && profile) drawOpening(el('premium-hero-board'), careerLevel(profile.unlockedLevel), visualSkin);
    for (const [id, value] of Object.entries({
        'premium-player-name': profile?.name ?? '',
        'premium-player-xp': profile ? profile.xp + ' XP' : '',
        'premium-player-stars': summary ? '★ ' + summary.totalStars : '',
        'premium-rival-icon': world?.icon ?? '',
        'premium-rival-name': world?.rival ?? '',
        'premium-world-name': world?.name ?? '',
        'premium-world-level': profile ? 'Level ' + profile.unlockedLevel : '',
        'premium-career-count': summary ? summary.clearedLevels + ' / ' + CAREER_LEVEL_COUNT : '',
    })) el(id).textContent = value;
    const points = el('premium-brain-points');
    const daily = DailyProgress.read(localDateKey());
    if (points) points.textContent = daily.status === 'ready' ? daily.progress.brainPoints + ' Brain Points' : 'Brain Points unavailable';
    const progress = el('premium-career-progress');
    progress.max = CAREER_LEVEL_COUNT;
    progress.value = summary?.clearedLevels ?? 0;
}
function closeHomePreview() {
    if (!homePreviewSkin) return false;
    homePreviewSkin = null;
    const hub = el('home-hub');
    for (const area of hub.querySelectorAll('.home-hero, .home-actions')) area.inert = false;
    el('home-preview-bar').hidden = true;
    renderSkinVariables(activeSkin());
    const profile = ProfileStore.read().profile;
    refreshPremiumHome(profile, profile ? careerSummary(profile) : null);
    hub.hidden = true;
    el('menu-page').hidden = false;
    ui.viewMenu.scrollTop = 0;
    showSkinPreview();
    el('skin-home-preview').focus?.();
    return true;
}
el('skin-home-preview').onclick = () => {
    // Static cosmetic previews neither run game timers nor play sound. A paused
    // match must not prevent opening one from the visible store.
    if (homePreviewSkin || el('skin-page').hidden || el('menu-page').hidden || ui.viewMenu.classList.contains('hidden')) return;
    stopSkinPreview();
    const skin = getSkin(previewSkinId);
    homePreviewSkin = skin.id;
    const hub = el('home-hub');
    for (const area of hub.querySelectorAll('.home-hero, .home-actions')) area.inert = true;
    renderSkinVariables(skin);
    const profile = ProfileStore.read().profile;
    refreshPremiumHome(profile, profile ? careerSummary(profile) : null, skin);
    el('menu-page').hidden = true;
    hub.hidden = false;
    el('home-preview-label').textContent = skin.name + ' · Preview only';
    el('home-preview-bar').hidden = false;
    ui.viewMenu.scrollTop = 0;
    el('home-preview-close').focus?.();
};
el('home-preview-close').onclick = closeHomePreview;
const refreshCareer = () => {
    syncSkin();
    const state = ProfileStore.read();
    if (state.status === 'invalid' || state.status === 'unavailable') {
        profileFeedback.textContent = state.status === 'invalid'
            ? 'Profile data could not be read. Reset only if you want to replace it.'
            : 'Profile storage is unavailable. Career progress cannot be saved.';
        el('career-start-btn').disabled = true;
        el('reset-career-btn').disabled = true;
        refreshPremiumHome(null, null);
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
    avatarPreview.dataset.avatar = p.avatar;
    avatarPreview.textContent = PLAYER_AVATARS.find(item => item.id === p.avatar)?.icon || '✨';
    for (const choice of document.querySelectorAll('[data-profile-avatar]')) {
        const id = choice.dataset.profileAvatar;
        choice.disabled = id === 'neon-fox' && !p.neonFoxUnlocked;
        choice.setAttribute('aria-pressed', String(id === p.avatar));
        const lock = choice.querySelector('[data-avatar-lock]');
        if (lock) lock.hidden = !choice.disabled;
    }
    el('identity-name').textContent = p.name;
    el('identity-art').dataset.avatar = p.avatar;
    el('identity-art').textContent = ['robot','spark','fox','neon-fox'].includes(p.avatar) ? '' : avatarPreview.textContent;
    const summary = careerSummary(p);
    refreshPremiumHome(p, summary);
    for (const [id, value] of Object.entries({
        'stat-played': summary.played,
        'stat-wins': summary.wins,
        'stat-draws': summary.draws,
        'stat-losses': summary.losses,
        'stat-win-rate': `${summary.winRate}%`,
        'stat-best-streak': summary.bestStreak,
        'stat-cleared': `${summary.clearedLevels} / ${CAREER_LEVEL_COUNT}`,
        'stat-stars': `${summary.totalStars} / ${CAREER_LEVEL_COUNT*3}`,
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
    careerProgress.textContent = `Level ${p.unlockedLevel} / ${CAREER_LEVEL_COUNT}`;
    const mission = missionFor(p.unlockedLevel);
    el('home-level').textContent = mission ? `Level ${p.unlockedLevel} · ${mission.title}` : careerProgress.textContent;
    drawOpening(el('home-opening'), careerLevel(p.unlockedLevel));
    const selected = Number(careerSelect.value) || p.unlockedLevel;
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
    readQuickSetup();
    renderQuickSetup();
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
    const gameSound = el('game-sound-btn');
    if (gameSound) {
        gameSound.setAttribute('aria-pressed', String(settings.sound));
        gameSound.title = settings.sound ? 'Mute game sound' : 'Unmute game sound';
        el('game-sound-label').textContent = settings.sound ? 'Sound on' : 'Sound off';
    }
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
el('game-sound-btn').onclick = () => setComfort({ sound: !soundToggle.checked, haptics: hapticsToggle.checked }, true);

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
document.querySelectorAll('[data-profile-avatar]').forEach(choice => {
    choice.onclick = () => {
        if (choice.disabled || homePreviewSkin) return;
        avatarSelect.value = choice.dataset.profileAvatar;
        avatarSelect.onchange();
    };
});
careerSelect.onchange = () => {
    const stage = careerLevel(Number(careerSelect.value));
    drawOpening(el('mission-preview'), stage);
    const profile = ProfileStore.read().profile;
    if (profile) renderRoute(profile, stage.level);
    careerDescription.textContent =
        missionFor(stage.level)?.clue ?? `Board ${stage.size} · ${stage.diff.toUpperCase()} AI · Win to unlock the next level`;
};
for (const [id, direction] of [['previous-chapter', -1], ['next-chapter', 1]]) {
    el(id).onclick = () => {
        const first = Math.floor((Number(careerSelect.value) - 1) / 5) * 5 + 1 + 5 * direction;
        const profile = ProfileStore.read().profile;
        if (!profile || first < 1 || first > profile.unlockedLevel) return;
        careerSelect.value = String(first);
        careerSelect.onchange();
    };
}
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

for (const avatar of PLAYER_AVATARS.filter(item => item.id !== 'neon-fox')) {
    const option = document.createElement('option');
    option.value = avatar.id;
    option.textContent = avatar.icon + ' ' + avatar.label;
    el('career-avatar').append(option);
}
el('career-identity').onsubmit = event => {
    event.preventDefault();
    const result = ProfileStore.createCareerPlayer(el('career-name').value, el('career-avatar').value);
    if (result.status !== 'ready') {
        el('identity-status').textContent = result.status === 'bad-name' ? 'Choose a name of 1–18 characters.' : 'Could not save player.';
        return;
    }
    el('career-identity').hidden = true;
    refreshCareer();
    refreshCareerSkins();
    el('career-start-btn').focus();
};

function refreshCareerSkins() {
    const {profile, daily} = skinState();
    const select = el('career-skin');
    const owned = skinCatalog(profile, daily, activeSkin().id, true);
    select.replaceChildren();
    for (const {skin} of owned) {
        const option = document.createElement('option');
        option.value = skin.id;
        option.textContent = skin.name;
        select.append(option);
    }
    select.value = activeSkin().id;
    el('career-skin-row').hidden = owned.length < 2;
}
el('career-skin').onchange = () => {
    const {profile, daily, key} = skinState();
    const id = el('career-skin').value;
    if (saveSkin(localStorage, key, id, profile, daily) === 'ready') {
        applySkin(id);
        refreshCareer();
    } else {
        el('career-skin').value = activeSkin().id;
        careerStatus.textContent = 'Could not equip this skin.';
    }
};

let size, mode, diff;
function readQuickSetup() {
    let saved;
    const key = LocalSlots.storageKey('rombmaster_quick_setup');
    try { if (key) saved = JSON.parse(localStorage.getItem(key)); } catch {}
    size = [4,6,8,10].includes(saved?.size) ? saved.size : 6;
    mode = saved?.mode === 'pvp' ? 'pvp' : 'ai';
    diff = ['easy','normal','hard'].includes(saved?.diff) ? saved.diff : 'normal';
}
function renderQuickSetup() {
    const board = { 4: 'Small', 6: 'Classic', 8: 'Large', 10: 'Grand' }[size];
    const difficulty = { easy: 'Casual', normal: 'Smart', hard: 'Master' }[diff];
    el('quick-summary').textContent = board + ' · ' + (mode === 'pvp' ? 'Two players' : difficulty + ' AI');
    for (const [key, value] of [['size', size], ['ai', mode], ['diff', diff]]) {
        for (const button of document.querySelectorAll(`[data-${key}]`)) {
            const selected = button.dataset[key] === String(value);
            button.classList[selected ? 'add' : 'remove']('selected');
            button.setAttribute('aria-pressed', String(selected));
        }
    }
    el('difficulty-wrapper').hidden = mode === 'pvp';
    drawOpening(el('setup-preview'), { size });
}
for (const button of document.querySelectorAll('[data-size],[data-ai],[data-diff]')) {
    button.onclick = () => {
        if (button.dataset.size) size = Number(button.dataset.size);
        if (button.dataset.ai) mode = button.dataset.ai;
        if (button.dataset.diff) diff = button.dataset.diff;
        renderQuickSetup();
    };
}
readQuickSetup();
renderQuickSetup();
el('setup-play').onclick = () => {
    const requested = { size, mode, diff };
    const activeId = LocalSlots.read().index?.activeId;
    const startNew = () => {
        if (LocalSlots.read().index?.activeId !== activeId) return;
        if (Game.start(requested.size, requested.mode, requested.diff)) {
            const key = LocalSlots.storageKey('rombmaster_quick_setup');
            try { if (key) localStorage.setItem(key, JSON.stringify(requested)); } catch {}
        }
    };
    askBeforeReplacing('Start New Game?', 'Your currently saved match for this player will be replaced. Career XP and Daily Brain Points stay safe.', startNew, el('setup-play'));
};
el('continueBtn').onclick = () => Game.resume();
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
let dailyEffectFrame = null;
let dailyLastMove = null;
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
        const homePoints = el('premium-brain-points');
        if (homePoints) homePoints.textContent = 'Brain Points unavailable';
        return;
    }
    el('daily-open-btn').disabled = false;
    el('daily-points').textContent = `${state.progress.brainPoints} Brain Points`;
    const homePoints = el('premium-brain-points');
    if (homePoints) homePoints.textContent = state.progress.brainPoints + ' Brain Points';
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
    dailyRenderer.draw(dailyPuzzle.board, dailyLastMove);
};
const stopDailyEffects = () => {
    if (dailyEffectFrame !== null) cancelAnimationFrame(dailyEffectFrame);
    dailyEffectFrame = null;
    dailyRenderer.particles = [];
    dailyLastMove = null;
    Game.stopCosmeticSound();
};
const animateDaily = move => {
    dailyLastMove = move;
    if (dailyEffectFrame !== null) cancelAnimationFrame(dailyEffectFrame);
    const frame = () => {
        dailyEffectFrame = null;
        if (!dailyPuzzle || dailyModal.hidden || Game.paused) return;
        dailyRenderer.draw(dailyPuzzle.board,dailyLastMove);
        if (dailyRenderer.particles.length) dailyEffectFrame = requestAnimationFrame(frame);
    };
    frame();
};
const dailyCapture = (result,player) => {
    for (const sq of result?.capturedSquares || []) dailyRenderer.spawnParticles(sq.r,sq.c,player);
};

const closeDaily = () => {
    stopDailyEffects();
    dailyModal.hidden = true;
    dailyPuzzle = null;
    dailySolved = false;
    refreshDailyMenu();
};

const showDaily = () => {
    stopDailyEffects();
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
        dailyCapture(human,1);
        let captured = human.points > 0;
        if (!human.points) {
            while (!board.isGameOver()) {
                lastMove = duelReply(board);
                const reply = board.makeMove(lastMove.t, lastMove.r, lastMove.c, 0);
                dailyCapture(reply,0);
                if (!reply.points) break;
                captured = true;
            }
        }
        Game.playCosmeticSound(captured ? 'capture' : 'move');
        animateDaily(lastMove);
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
        const result = board.makeMove(move.t, move.r, move.c, 1);
        dailyCapture(result,1);
        Game.playCosmeticSound(result.points ? 'capture' : 'move');
        animateDaily(move);
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
document.addEventListener('visibilitychange', () => {
    Game.setActive('visibility', !document.hidden);
    arcade?.activity();
    if (document.hidden) {
        stopSkinPreview();
        stopDailyEffects();
    } else if (el('skin-page').hidden === false && el('menu-page').hidden === false) showSkinPreview();
});
window.addEventListener('pagehide', () => {Game.setActive('page', false);arcade?.activity();});
window.addEventListener('pageshow', () => {Game.setActive('page', true);arcade?.activity();});
Native.onStateChange(({ isActive }) => {
    Game.setActive('native', isActive);
    arcade?.activity();
    if (!isActive) { stopSkinPreview(); stopDailyEffects(); }
    else if (el('skin-page').hidden === false && el('menu-page').hidden === false) showSkinPreview();
});
Game.setActive('visibility', !document.hidden);

Native.onBack(() => {
    if (closeHomePreview()) return;
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
    } else if (closeSkinDetails()) {
        return;
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

