import './style.css';
import './skin-store-compact.css';
import './neon-screens.css';
import './neon-p1-home.css';
import './neon-p1-transitions.css';
import './neon-p1-material.css';
import './neon-p1-press.css';
import './neon-p113-home.css';
import './neon-p114-home.css';
import './neon-p22-quick-layout.css';
import './neon-p23-quick-glass.css';
import './neon-p24-quick-preview.css';
import './neon-p25-quick-motion.css';
import './neon-p26-quick-polish.css';
import './neon-p26e-quick-fit.css';
import './neon-p26f-quick-finish.css';
import './neon-p32-career-nav.css';
import './neon-p33-career-levels.css';
import { mountArcade } from './arcade-ui.js';
import { missionFor, drawOpening } from './career-missions.js';
import { Game } from './game.js';
import { Native } from './native.js';
import { mountNeonHomePress, clearNeonHomePress } from './neon-home-press.js';
import { ProfileStore, LocalSlots, MAX_LOCAL_PLAYERS, PLAYER_AVATARS, configureCharacterEconomy, careerSummary, careerLevel, CAREER_LEVEL_COUNT, careerWorld, CAREER_WORLDS } from './profile.js';
import { TUTORIAL_STEPS, tutorialStep } from './tutorial.js';
import { Renderer } from './renderer.js';
import { CONSTANTS } from './constants.js';
import { Board } from './board.js';
import { SKINS, SKIN_KEY, getSkin, activeSkin, setActiveSkin, unlockedSkin, readSkin, saveSkin, skinCatalog, seasonalCatalog, prestigeCatalog, seasonStatus, seasonalPriceLabel, WALLET_KEY, SKIN_PRICES, syncWallet, walletBalance, buyWalletSkin, skinUnlockLabel, CHARACTERS, getCharacter, characterEntitlement, buyWalletCharacter, skinVictoryPreview } from './skins.js';
import { nearestLegalLine, canvasPoint } from './input.js';
import { duelReply, createDailyPuzzle, evaluateDailyMove, localDateKey } from './daily-challenge.js';
import { DailyProgress } from './daily-progress.js';
import { createConfirmationController } from './confirmation.js';

// Scope the closed test at the UI boundary. Stored profiles retain the full campaign.
const coreEdition = document.documentElement?.dataset?.edition === 'core';
const campaignLimit = coreEdition ? 30 : CAREER_LEVEL_COUNT;
function visibleProfile(profile) {
    if (!coreEdition || !profile) return profile;
    return {...profile, unlockedLevel: Math.min(profile.unlockedLevel, campaignLimit),
        stars: Object.fromEntries(Object.entries(profile.stars || {}).filter(([level]) => Number(level) <= campaignLimit))};
}

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
    onVisibilityChange: open => { Game.setActive('confirmation', !open); arcade?.activity(); },
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

const arcade=mountArcade({game:Game,confirmLeave: options=>confirmDialog.open(options)});
const menuPages = {
    'career-page': 'Career',
    'quick-settings': 'Quick Play',
    'player-settings': 'Player profile',
    'comfort-settings': 'Sound & feedback',
    'skin-page': 'Skin Store',
    ...(el('arcade-page')?{'arcade-page':'Challenge Arena'}:{}),
};
let pageTrigger = null;
// All pages retain their original DOM controls and save handlers.
const careerScreens=['levels','mission','rivals'],skinDetailScreens=['overview','board','effects'];
let careerScreen=0,skinDetailScreen=0,achievementPage=0,avatarPage=0,achievementView=false,creatingPlayer=false;
const bindPage=(id,action)=>{const node=el(id);if(node)node.onclick=action;};
function setCareerScreen(index=0){
    careerScreen=Math.max(0,Math.min(careerScreens.length-1,index));
    const identityOpen=!el('career-identity').hidden;
    el('career-screen-nav').hidden=identityOpen;
    for(const pane of document.querySelectorAll('[data-career-screen]'))pane.hidden=identityOpen||pane.dataset.careerScreen!==careerScreens[careerScreen];
    el('career-screen-prev').disabled=careerScreen===0;
    el('career-screen-next').disabled=careerScreen===2;
    for(const tab of document.querySelectorAll('[data-career-tab]')){
        tab.setAttribute('aria-pressed',String(tab.dataset.careerTab===careerScreens[careerScreen]));
    }
    el('career-screen-label').textContent=['Choose a level','Mission preview','Your rivals'][careerScreen]+' · '+(careerScreen+1)+' / 3';
}
function setSkinDetailScreen(index=0){
    skinDetailScreen=Math.max(0,Math.min(2,index));
    for(const pane of document.querySelectorAll('[data-skin-detail-screen]'))pane.hidden=pane.dataset.skinDetailScreen!==skinDetailScreens[skinDetailScreen];
    el('skin-detail-prev').disabled=skinDetailScreen===0;
    el('skin-detail-next').disabled=skinDetailScreen===2;
    el('skin-detail-page-label').textContent=['Overview','Board preview','Effects'][skinDetailScreen]+' · '+(skinDetailScreen+1)+' / 3';
}
function paginateRows(rows,page,size,prevId,nextId,labelId){
    const count=Math.max(1,Math.ceil(rows.length/size)),current=Math.max(0,Math.min(count-1,page));
    rows.forEach((row,i)=>row.hidden=i<current*size||i>=(current+1)*size);
    el(prevId).disabled=current===0;el(nextId).disabled=current===count-1;
    el(labelId).textContent=(current+1)+' / '+count;
    return {current,count};
}
function renderAchievementPage(){
    const rows=Array.from(el('achievement-list').children||[]);
    const size=window.innerHeight<560?2:window.innerHeight<740?4:6;
    achievementPage=paginateRows(rows,achievementPage,size,'profile-achievements-prev','profile-achievements-next','profile-achievements-label').current;
}
function setAchievementView(show=false){
    achievementView=show;el('profile-stat-grid').hidden=show;el('profile-achievements-page').hidden=!show;
    el('profile-stats-toggle').textContent=show?'‹ Statistics':'View achievements ›';
    if(show)renderAchievementPage();
}
function renderAvatarPage(){
    const filter=el('character-filter')?.value||'all';
    document.querySelectorAll('.rm-character-categories input').forEach(input=>{input.checked=input.value===filter;});
    const all=Array.from(document.querySelectorAll('[data-profile-avatar]'));
    const rows=all.filter(row=>filter==='all'||(filter==='owned'?row.dataset.entitlement==='owned':getCharacter(row.dataset.profileAvatar)?.category===filter));
    all.forEach(row=>{row.hidden=true;});
    if(el('character-empty'))el('character-empty').hidden=rows.length!==0;
    // Match the actual grid columns; no incomplete second row at short heights.
    const w=window.innerWidth,h=window.innerHeight;
    const size=h<=540?(w>=600?6:2):h<700?(w>=600?4:3):(w>=600?8:6);
    if(el('character-count')){
        const owned=all.filter(row=>row.dataset.entitlement==='owned').length;
        el('character-count').textContent=filter==='all'?owned+' / '+all.length+' owned':rows.length+' / '+all.length;
        el('character-count').setAttribute('aria-label',owned+' owned of '+all.length+' characters; '+rows.length+' in this category');
    }
    const result=paginateRows(rows,avatarPage,size,'profile-avatar-prev','profile-avatar-next','profile-avatar-page');
    avatarPage=result.current;el('profile-avatar-pager').hidden=result.count===1;
}
function setCreatePlayer(show=false){
    creatingPlayer=show;el('profile-create-form').hidden=!show;
    el('profile-create-toggle').setAttribute('aria-expanded',String(show));
    el('profile-create-toggle').textContent=show?'‹ Existing players':'Create new player ›';
    el('rm-player-chooser').hidden=show;
    el('local-player-feedback').textContent='';
    const nameRow=el('profile-name')?.parentElement;if(nameRow)nameRow.hidden=show;
}
function backSubpage(){
    if(el('menu-page').hidden)return false;
    if(!el('skin-page').hidden&&skinDetailsOpen&&skinDetailScreen>0){setSkinDetailScreen(skinDetailScreen-1);return true;}
    if(!el('career-page').hidden&&careerScreen>0){setCareerScreen(careerScreen-1);return true;}
    if(!el('player-settings').hidden){
        if(creatingPlayer&&el('profile-section-players').checked){setCreatePlayer(false);return true;}
        if(achievementView&&el('profile-section-stats').checked){setAchievementView(false);return true;}
    }
    return false;
}
bindPage('career-screen-prev',()=>setCareerScreen(careerScreen-1));
bindPage('career-screen-next',()=>setCareerScreen(careerScreen+1));
bindPage('career-open-mission',()=>setCareerScreen(1));
for(const tab of document.querySelectorAll('[data-career-tab]')){
    tab.onclick=()=>{
        const index=careerScreens.indexOf(tab.dataset.careerTab);
        if(index<0||!el('career-identity').hidden||el('career-page').hidden||el('menu-page').hidden)return;
        setCareerScreen(index);
    };
}
bindPage('skin-detail-prev',()=>setSkinDetailScreen(skinDetailScreen-1));
bindPage('skin-detail-next',()=>setSkinDetailScreen(skinDetailScreen+1));
bindPage('profile-create-toggle',()=>setCreatePlayer(!creatingPlayer));
bindPage('profile-stats-toggle',()=>{achievementPage=0;setAchievementView(!achievementView);});
bindPage('profile-achievements-prev',()=>{achievementPage--;renderAchievementPage();});
bindPage('profile-achievements-next',()=>{achievementPage++;renderAchievementPage();});
bindPage('profile-avatar-prev',()=>{avatarPage--;renderAvatarPage();});
bindPage('profile-avatar-next',()=>{avatarPage++;renderAvatarPage();});
if(el('character-filter'))el('character-filter').onchange=()=>{avatarPage=0;renderAvatarPage();};
document.querySelectorAll('.rm-character-categories input').forEach(input=>{input.onchange=()=>{if(input.checked){el('character-filter').value=input.value;avatarPage=0;renderAvatarPage();}};});
if(el('profile-section-avatar'))el('profile-section-avatar').onchange=()=>{avatarPage=0;renderAvatarPage();};
window.addEventListener('resize',()=>{if(!el('player-settings').hidden){renderAvatarPage();if(achievementView)renderAchievementPage();}});
function showHome() {
    if(document.documentElement?.dataset) delete document.documentElement.dataset.rmIntroSettled;
    readQuickSetup();
    renderQuickSetup();
    arcade?.leave();
    stopSkinPreview();
    skinDetailsOpen = false;
    el('page-back').textContent = '← Back';
    el('menu-page').hidden = true;
    clearNeonHomePress(document);
    el('home-hub').hidden = false;
    ui.viewMenu.scrollTop = 0;
    pageTrigger?.focus();
    pageTrigger = null;
}
document.querySelectorAll('[data-page]').forEach(button => {
    button.onclick = () => {
        pageTrigger = button;
        const selected = button.dataset.page;
        if (coreEdition && selected === 'arcade-page') return;
        if (coreEdition && button.id === 'startBtn') {
            const profile = ProfileStore.read();
            const saved = Game.refreshSavedGame();
            if (['empty', 'ready'].includes(profile.status) && profile.profile.unlockedLevel === 1 &&
                !profile.profile.stars?.[1] && saved.status === 'empty') {
                const stage = careerLevel(1);
                Game.start(stage.size, 'ai', stage.diff, 1);
                return;
            }
        }
        if(selected!=='arcade-page')arcade?.leave();
        if (selected !== 'skin-page') stopSkinPreview();
        if (selected === 'career-page') {
            const state = ProfileStore.read();
            const profile = visibleProfile(state.profile);
            el('career-identity').hidden = state.status !== 'empty';
            if (state.status === 'empty') {
                el('career-name').value = profile.name;
                el('career-avatar').value = profile.avatar;
                renderStarterCharacter('career-avatar');
                el('identity-status').textContent = '';
            }
            refreshCareerSkins();
            if (profile) {
                careerSelect.value = String(profile.unlockedLevel);
                careerSelect.onchange();
            }
        }
        for (const id of Object.keys(menuPages)) el(id).hidden = id !== selected;
        if(selected==='career-page')setCareerScreen(0);
        if(selected==='player-settings'){setCreatePlayer(false);refreshPlayerChooser();setAchievementView(false);avatarPage=0;el('character-filter').value='all';refreshCareer();renderAvatarPage();}
        if (selected === 'quick-settings') {
            readQuickSetup();
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
// On the Android Core Home, Career / Profile / Skin Store form one physical
// button row. Move the existing Profile node (never clone it) so listeners,
// profile data and accessible control identity remain unchanged. The complete
// edition retains its established navigation layout.
function arrangeCoreHomeNavigation() {
    if (!coreEdition) return;
    const modeGrid = el('home-hub')?.querySelector('.mode-grid');
    const homeTools = el('home-tools');
    const profileButton = homeTools?.querySelector('[data-page="player-settings"]');
    const skinStoreButton = el('home-skin-store');
    if (!modeGrid || !profileButton || !skinStoreButton ||
        typeof modeGrid.insertBefore !== 'function') return;
    modeGrid.insertBefore(profileButton, skinStoreButton);
    homeTools.hidden = true;
}
arrangeCoreHomeNavigation();
// P1.6: start light feedback at pointer-down; click stays instantaneous.
mountNeonHomePress(document);

el('page-back').onclick = () => { if (!backSubpage() && !closeSkinDetails() && !arcade?.back()) showHome(); };

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
// Reuse the existing non-scrolling avatar pane and its pagination.
const avatarGrid=document.querySelector('.premium-avatar-grid');
if(avatarGrid&&avatarSelect){
    const cards=[],options=[];
    for(const c of CHARACTERS){
        const option=document.createElement('option');option.value=c.id;option.textContent=c.label;options.push(option);
        const choice=document.createElement('button');choice.type='button';choice.className='avatar-choice';
        choice.dataset.profileAvatar=c.id;choice.dataset.category=c.category;choice.setAttribute('aria-pressed','false');
        const art=document.createElement('span');art.className='avatar-art';art.dataset.avatar=c.id;art.setAttribute('aria-hidden','true');
        const name=document.createElement('strong');name.textContent=c.label;
        const status=document.createElement('small');status.dataset.avatarLock='';status.hidden=true;
        choice.append(art,name,status);cards.push(choice);
    }
    avatarGrid.replaceChildren(...cards);avatarSelect.replaceChildren(...options);
}
function characterStatus(c,entitlement,wallet){
    if(entitlement==='owned')return 'Owned';
    if(entitlement==='locked')return 'Win level '+c.level;
    if(entitlement==='coins')return c.price+' Coins';
    if(c.currency==='gems')return c.price+' Gems · Preview';
    return 'Coming soon';
}
// Presentation only: derive progress from validated Career stars, never from wallet or unlocked level.
function renderCareerProgress(profile) {
    const cleared=profile?Object.keys(profile.stars||{}).length:0;
    const meter=el('career-clear-progress');
    if(meter){meter.max=campaignLimit;meter.value=cleared;meter.hidden=!profile;}
    if(careerProgress)careerProgress.textContent=profile
        ? 'Completed '+cleared+' of '+campaignLimit+' · Next: Level '+Math.min(profile.unlockedLevel,campaignLimit)
        : 'Career progress unavailable';
}
function renderRoute(profile, selected) {
    const route = el('chapter-route');
    const first = Math.floor((selected - 1) / 5) * 5 + 1;
    // Core UI presents six rivals over 30 levels (five per rival).
    // The historical 100-level world/AI/save tables are never modified.
    const world=coreEdition ? CAREER_WORLDS[Math.floor((selected-1)/5)] : careerWorld(selected);
    if(!world)return;
    renderCareerProgress(profile);
    const mission=missionFor(selected);
    const setText=(id,value)=>{const node=el(id);if(node)node.textContent=value;};
    const chapterPortrait=el('career-chapter-portrait');
    if(chapterPortrait)chapterPortrait.dataset.rival=world.rival.toLowerCase();
    const chapterCleared=Array.from({length:5},(_,i)=>first+i).filter(level=>Boolean(profile.stars[level])).length;
    setText('career-chapter-number','CHAPTER '+String(Math.floor((selected-1)/5)+1).padStart(2,'0'));
    setText('career-chapter-rival',world.rival);
    setText('career-chapter-name',world.name);
    setText('career-chapter-count',chapterCleared+' / 5 completed');
    const chapterMeter=el('career-chapter-progress');
    if(chapterMeter)chapterMeter.value=chapterCleared;
    setText('career-level-play','Play Level '+selected);
    const portrait=el('career-mission-portrait');
    const guidedFox=selected===5;
    if(portrait)portrait.dataset.rival=guidedFox?'guided-fox':world.rival.toLowerCase();
    setText('career-mission-level','LEVEL '+selected+' / '+campaignLimit+(selected===world.end?' · BOSS BATTLE':''));
    setText('career-mission-title',mission?.title||(selected===world.end?'Boss Battle':'Career mission'));
    setText('career-mission-rival',guidedFox?'Fox · '+world.name:world.rival+' · '+world.name);
    setText('career-open-mission','Preview Level '+selected+' ›');
    el('chapter-label').textContent = world.name+' · Chapter '+(Math.floor((selected-1)/5)+1)+' of '+Math.ceil(campaignLimit/5);
    const rival=el('career-rival');
    if(rival)rival.textContent = coreEdition ? 'Rival: '+world.rival : world.icon+' '+world.rival+' · '+world.focus;
    el('previous-chapter').disabled = first === 1;
    el('next-chapter').disabled = first + 5 > profile.unlockedLevel;
    el('career-start-btn').textContent = 'Play Level ' + selected;
    const nodes = [];
    for (let level = first; level < first + 5; level++) {
        const button = document.createElement('button');
        button.type = 'button';
        button.disabled = level > profile.unlockedLevel;
        button.dataset.levelState=button.disabled?'locked':profile.stars[level]?'cleared':'available';
        button.dataset.boss=String(careerWorld(level)?.end===level);
        button.setAttribute('aria-pressed', String(level === selected));
        const number = document.createElement('b');
        number.textContent = level;
        const title = document.createElement('span');
        title.textContent = coreEdition ? 'Level '+level : (careerWorld(level)?.end===level?'Boss Battle':missionFor(level)?.title ?? 'Level ' + level);
        const stars = document.createElement('small');
        const earned=profile.stars[level]||0;
        button.dataset.earnedStars=String(earned);
        stars.textContent=button.disabled?'🔒 Locked':earned?'✓ Completed · '+'★'.repeat(earned):'▶ Play now';
        button.setAttribute('aria-label','Level '+level+' · '+title.textContent+' · '+(button.disabled?'Locked':earned?earned+' of 3 stars':'Available'));
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
    const daily=DailyProgress.read(localDateKey()).progress, walletKey=LocalSlots.storageKey(WALLET_KEY);
    const wallet=syncWallet(localStorage,walletKey,state.profile,daily);
    return { profile: state.profile?{...state.profile,skinWallet:wallet.wallet}:null, originalProfile:state.profile,daily,wallet,walletKey,key:LocalSlots.storageKey(SKIN_KEY) };
};
// Profile equip and Career reset use the same per-slot wallet as the store.
configureCharacterEconomy({
    entitlement(id,profile){
        const daily=DailyProgress.read(localDateKey()).progress;
        const result=syncWallet(localStorage,LocalSlots.storageKey(WALLET_KEY),profile,daily);
        return characterEntitlement(id,profile,result.wallet);
    },
    preserve(profile){
        const daily=DailyProgress.read(localDateKey()).progress;
        return syncWallet(localStorage,LocalSlots.storageKey(WALLET_KEY),profile,daily).status;
    }
});
// Presentation observes the persisted wallet; it never awards a second time.
Game.rewardWalletSnapshot=()=>{
    const s=skinState();
    if(s.wallet.status!=='ready'||!s.walletKey||!s.wallet.wallet)return null;
    return {key:s.walletKey,balance:walletBalance(s.wallet.wallet),owned:[...s.wallet.wallet.owned],
        characters:CHARACTERS.filter(c=>characterEntitlement(c.id,s.originalProfile,s.wallet.wallet)==='owned').map(c=>c.id),
        nextReward:CHARACTERS.filter(c=>c.category==='career'&&characterEntitlement(c.id,s.originalProfile,s.wallet.wallet)!=='owned').sort((a,b)=>a.level-b.level)[0]||null};
};
Game.rewardSkinName=id=>getSkin(id).name;
// Read-only result presentation. The final move remains the only reward writer.
let resultAnimation=0;
// Infinity uses the existing Career Level 100 entitlement; no extra reward or unlock write.
function isInfinityResult(){
    const outcome=Game.careerOutcome;
    return !coreEdition && Game.settings.careerLevel===CAREER_LEVEL_COUNT &&
        outcome?.status==='ready' && outcome.victory===true &&
        Boolean(outcome.profile?.stars?.[CAREER_LEVEL_COUNT]);
}
function renderPremiumResult(){
    const overview=document.querySelector('#overlay .rm-result-overview');
    if(!overview)return;
    let summary=el('premium-result-summary');
    if(!summary){
        summary=document.createElement('div');summary.id='premium-result-summary';
        overview.append(summary);
    }
    resultAnimation++;
    const generation=resultAnimation;
    summary.replaceChildren();
    const outcome=Game.settings.careerLevel?Game.careerOutcome:null;
    const wallet=outcome?.walletReward;
    const ready=outcome?.status==='ready';
    summary.hidden=!ready;
    if(!ready)return;
    const metrics=document.createElement('div');metrics.className='rm-result-metrics';
    function metric(label,value){
        const card=document.createElement('div');card.className='rm-result-metric';
        const name=document.createElement('small');name.textContent=label;
        const number=document.createElement('strong');
        const target=Number.isSafeInteger(value)&&value>=0?value:null;
        number.textContent=target===null?'Unavailable':'+'+target;
        card.append(name,number);metrics.append(card);
        if(target>0&&typeof requestAnimationFrame==='function'&&!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches){
            // Start after the first painted frame; the previous 650 ms reveal
            // could finish during the transition into the result overlay.
            number.textContent='+0';
            let startTime=null;
            function tick(now){
                if(generation!==resultAnimation||!number.isConnected||!el('overlay').classList.contains('flex'))return;
                if(startTime===null)startTime=now;
                const t=Math.max(0,Math.min(1,(now-startTime-250)/1450));
                number.textContent='+'+Math.round(target*(1-(1-t)**2));
                if(t<1)requestAnimationFrame(tick);
            }
            requestAnimationFrame(()=>requestAnimationFrame(tick));
        }
    }
    metric('Coins earned',wallet?.coins);
    metric('XP earned',outcome.earnedXP);
    if (coreEdition && Game.settings.careerLevel === 1 && outcome.victory) {
        const turns = Game.historyStack;
        for (let i = turns.length - 1; i >= 0; i--) {
            const after = turns[i + 1]?.score ?? Game.board.score;
            const gained = after[CONSTANTS.X] - turns[i].score[CONSTANTS.X];
            if (gained <= 0) continue;
            const move = Game.moveLog[i];
            const note = document.createElement('p');
            note.textContent = 'Your last capture: the ' + (move.t === 'h' ? 'horizontal' : 'vertical') +
                ' line at row ' + (move.r + 1) + ', column ' + (move.c + 1) +
                ' closed ' + gained + (gained === 1 ? ' square.' : ' squares.');
            summary.append(note);
            break;
        }
        el('againBtn').textContent = 'Play again';
    }
    summary.append(metrics);
    const total=document.createElement('small');total.className='rm-result-total';
    total.textContent=outcome.profile.xp+' XP total';
    summary.append(total);
    const next=coreEdition ? null : wallet?.nextReward;
    if(next&&Number.isInteger(next.level)){
        const progress=document.createElement('div');progress.className='rm-result-progress';
        const label=document.createElement('small');
        const cleared=Object.keys(outcome.profile.stars||{}).map(Number).filter(n=>n<=next.level).length;
        label.textContent='Next character: '+next.label+' · Win level '+next.level;
        const bar=document.createElement('progress');bar.max=next.level;bar.value=Math.min(cleared,next.level);
        bar.setAttribute('aria-label','Career levels cleared toward '+next.label);
        progress.append(label,bar);summary.append(progress);
    }
    const characterNames=(wallet?.characterUnlocks||[]).map(id=>getCharacter(id)?.label||id);
    if(outcome.foxUnlocked&&!characterNames.includes('Neon Fox'))characterNames.push('Neon Fox');
    const achievements=outcome.newAchievements||[];
    if(achievements.length){
        const note=document.createElement('small');
        note.className='rm-result-achievements';
        note.textContent=achievements.length===1?'Achievement: '+achievements[0].title:achievements.length+' new achievements · View in Profile';
        summary.append(note);
    }
    if(!coreEdition && characterNames.length){
        const unlock=document.createElement('p');unlock.className='rm-result-character-unlock';
        unlock.textContent='Character unlocked: '+characterNames.join(', ');summary.append(unlock);
    }
    if(isInfinityResult()){
        const milestone=document.createElement('div');milestone.className='rm-infinity-milestone';
        const symbol=document.createElement('span');symbol.className='rm-infinity-symbol';symbol.setAttribute('aria-hidden','true');symbol.textContent='∞';
        const copy=document.createElement('div');copy.className='rm-infinity-copy';
        const title=document.createElement('strong');title.textContent='Career complete · Infinity unlocked';
        const detail=document.createElement('small');detail.textContent='Congratulations! Your next challenge awaits in Infinity.';
        copy.append(title,detail);milestone.append(symbol,copy);summary.append(milestone);
    }
}
Game.refreshResultPages=()=>{
    const overlay=el('overlay');
    overlay.dataset.resultPage='overview';
    if(el('result-page-nav'))el('result-page-nav').hidden=true;
    const infinity=isInfinityResult();
    overlay.dataset.infinity=String(infinity);
    renderPremiumResult();
    const next=el('nextCareerBtn');
    if (coreEdition) el('againBtn').hidden = Game.settings.careerLevel > campaignLimit;
    if (next && coreEdition && Game.settings.careerLevel >= campaignLimit) next.hidden = true;
    if(next&&infinity){
        next.textContent='Continue to Infinity ∞';
        next.hidden=false;
    }
    // A single result view. Keep a persistence failure visible, not duplicated XP.
    const reward=el('career-reward');
    if(reward)reward.hidden=!Game.settings.careerLevel||Game.careerOutcome?.status==='ready';
    const analysis=el('match-analysis');
    if(analysis)analysis.hidden=true;
};
function applySkin(id) {
    renderSkinVariables(setActiveSkin(id));
}
function renderSkinVariables(skin) {
    const root = document.documentElement;
    if (!root) return; // headless input tests
    root.dataset.skin = skin.id;
    const profileAction = document.querySelector('#home-hub button[data-page="player-settings"]');
    if (profileAction) {
        if (coreEdition && skin.id === 'neon') el('home-skin-store').before(profileAction);
        else el('home-tools').append(profileAction);
    }
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
    applySkin(coreEdition ? 'neon' : readSkin(localStorage,key,profile,daily));
}
let previewSkinId = 'neon';
let skinCatalogPage = 0;
let skinDetailsOpen = false;
const SKIN_PAGE_SIZE = 6;
function setSkinPanel(detail) {
    skinDetailsOpen = detail;
    el('skin-catalog-panel').hidden = detail;
    el('skin-detail-panel').hidden = !detail;
    el('page-back').textContent = '← Back';
    if (detail) {
        setSkinDetailScreen(0);
        el('page-title').textContent = 'Skin Details';
        const skin = getSkin(previewSkinId);
        const art = el('skin-detail-art');
        art.src = skin.prestige ? '/assets/premium/master/' + skin.id + '-master-arena.webp' : ['neon','royal'].includes(skin.id) ? '/assets/premium/master/' + skin.id + '-master-store.webp' : '/assets/premium/reference/' + skin.id + '-reference-hero.webp';
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
let prestigeOnly = false;
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
    el('skin-home-preview').disabled=Boolean(skin.prestige);
    el('skin-home-preview').textContent=skin.prestige?'Home preview coming soon':'Preview complete home screen';
    el('skin-effect-preview').disabled=Boolean(skin.prestige);
    const crest=el('seasonal-crest');
    if(crest)crest.hidden=!skin.offer;
    const victoryButton=el('skin-victory-preview');
    if(victoryButton){
        victoryButton.hidden=false;
        victoryButton.textContent=skinVictoryPreview(skin).animated?'▶ Preview victory & sound':'Preview victory artwork';
    }
    if (stage.style.setProperty) {
        for (const [name,value] of Object.entries({
            '--skin-bg':skin.colors.bg,'--skin-x':skin.colors.x,'--skin-o':skin.colors.o,
            '--skin-accent':skin.accent,'--skin-ink':skin.id === 'white' ? '#182334' : '#f8fafc',
            '--skin-panel':skin.id === 'white' ? '#ffffff' : skin.colors.bg,
            '--skin-gold':skin.colors.lastMove,
        })) stage.style.setProperty(name,value);
    }
    const price=SKIN_PRICES[skin.id],balance=walletBalance(profile?.skinWallet);
    el('skin-equip').disabled = activeSkin().id === skin.id || (!unlocked&&(!price||!profile?.skinWallet||balance<price));
    el('skin-equip').textContent = activeSkin().id === skin.id ? 'Equipped' : unlocked ? 'Equip skin' : price ? 'Buy · '+price+' Coins' : 'Locked';
    if (coreEdition) {
        el('skin-equip').disabled = true;
        el('skin-equip').textContent = skin.id === 'neon' ? 'Equipped' : 'Preview only';
        el('skin-status').textContent = skin.id === 'neon' ? 'Included' : 'Royal Gold · Preview only';
    } else if(skin.prestige){
        el('skin-equip').disabled=true;
        el('skin-equip').textContent='Prestige · Preview only';
        el('skin-status').textContent='Premium cosmetic · No payment enabled';
    } else if (skin.offer) {
        const {active,daysLeft}=seasonStatus(skin.offer);
        el('skin-equip').disabled=true;
        el('skin-equip').textContent = active ? 'Purchases coming soon' : 'Out of season';
        el('skin-status').textContent = (active ? daysLeft+' days left' : 'Season: '+skin.offer.start+' – '+skin.offer.end) + ' · Target price '+seasonalPriceLabel(skin)+' · No payment enabled';
    } else {
        const walletAvailable=Boolean(profile?.skinWallet);
        const status=unlocked?(activeSkin().id===skin.id?'Equipped':'Owned'):skinUnlockLabel(skin.id);
        el('skin-status').textContent=status+' · '+(walletAvailable?'Balance '+balance+' Coins':'Wallet unavailable')+
            (!unlocked&&price&&walletAvailable&&balance<price?' · Need '+(price-balance)+' more Coins':'');
    }
    el('skin-effect-label').textContent = skin.prestige ? 'Victory artwork available · Individual capture, victory and audio effects are planned.' : 'Capture effect: ' + skin.catalog.effect + (skin.catalog.victory ? ' · Victory: '+skin.catalog.victory : '');
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
    const entries = coreEdition ? skinCatalog(profile,daily,'neon',false)
        .filter(({skin}) => skin.id === 'neon' || (!collectionOnly && skin.id === 'royal'))
        .map(entry => ({...entry, owned: entry.skin.id === 'neon', status: entry.skin.id === 'neon' ? 'Equipped' : 'Preview only'}))
        : prestigeOnly ? prestigeCatalog() : seasonalOnly ? seasonalCatalog() : skinCatalog(profile,daily,activeSkin().id,collectionOnly);
    const owned = skinCatalog(profile,daily,activeSkin().id,true);
    el('skin-owned-count').textContent = coreEdition ? 'Neon Arena included' : prestigeOnly ? '3 Prestige skins · Preview only' : seasonalOnly ? entries.filter(e=>e.active).length+' seasonal offers in season · Preview all '+entries.length : owned.length + ' / ' + SKINS.length + ' skins unlocked · '+(profile?.skinWallet?walletBalance(profile.skinWallet)+' Coins':'Wallet unavailable');
    el('skin-tab-store').setAttribute('aria-pressed',String(!collectionOnly && !seasonalOnly && !prestigeOnly));
    el('skin-tab-collection').setAttribute('aria-pressed',String(collectionOnly));
    el('skin-tab-seasonal')?.setAttribute('aria-pressed',String(seasonalOnly));
    el('skin-tab-prestige')?.setAttribute('aria-pressed',String(prestigeOnly));
    el('page-title').textContent = prestigeOnly ? 'Prestige Collection' : seasonalOnly ? 'Seasonal Collection' : collectionOnly ? 'My Collection' : 'Skin Store';
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
        button.dataset.ownership = status === 'Equipped' ? 'equipped' : owned ? 'owned' : skin.prestige ? 'prestige-preview' : skin.offer ? 'seasonal-preview' : SKIN_PRICES[skin.id] ? 'coins' : 'locked';
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
            part('skin-card-action',owned?'View collection item ›':skin.offer||skin.prestige?'Preview ›':'View skin ›'));
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
    prestigeOnly=false;
    seasonalOnly = false;
    collectionOnly = ownedOnly;
    previewSkinId = activeSkin().id;
    skinCatalogPage = 0;
    setSkinPanel(false);
    renderSkinCatalog();
}
el('skin-page-prev').onclick = () => changeSkinCatalogPage(-1);
el('skin-page-next').onclick = () => changeSkinCatalogPage(1);
el('skin-tab-store').onclick = () => { prestigeOnly=false; seasonalOnly=false; collectionOnly = false; skinCatalogPage=0; renderSkinCatalog(); };
el('skin-tab-collection').onclick = () => { prestigeOnly=false; seasonalOnly=false; collectionOnly = true; skinCatalogPage=0; renderSkinCatalog(); };
if(el('skin-tab-seasonal')) el('skin-tab-seasonal').onclick = () => { prestigeOnly=false; collectionOnly=false; seasonalOnly=true; skinCatalogPage=0; renderSkinCatalog(); };
if(el('skin-tab-prestige')) el('skin-tab-prestige').onclick = () => { collectionOnly=false; seasonalOnly=false; prestigeOnly=true; skinCatalogPage=0; renderSkinCatalog(); };
el('skin-effect-preview').onclick = () => {
    if (getSkin(previewSkinId).prestige || el('skin-page').hidden || Game.paused || !skinPreviewRenderer || !skinPreviewBoard) return;
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
    const preview=skinVictoryPreview(skin);
    if(el('skin-page').hidden || !victory || (preview.animated&&Game.paused))return;
    victory.dataset.victorySkin=skin.id;
    victory.dataset.victoryMode=preview.animated?'animated':'static';
    victory.textContent=preview.title;
    victory.classList.remove('playing');
    victory.hidden=false;
    if(!preview.animated)return; // Read-only art: no audio, animation, entitlement or progress changes.
    void victory.offsetWidth;
    victory.classList.add('playing');
    Game.playCosmeticSound('win',skin.id);
};
el('skin-equip').onclick = () => {
    if (coreEdition) return;
    const {profile,daily,key,walletKey,originalProfile} = skinState();
    if(!unlockedSkin(previewSkinId,profile,daily)&&SKIN_PRICES[previewSkinId]){
      const id=previewSkinId, owner=LocalSlots.read().index?.activeId;
      confirmDialog.open({heading:'Unlock '+getSkin(id).name+'?',detail:'Spend '+SKIN_PRICES[id]+' earned Coins on this cosmetic skin?',confirmLabel:'Buy skin',cancelLabel:'Cancel',onConfirm:()=>{
        if(LocalSlots.read().index?.activeId!==owner)return;
        const fresh=skinState(), result=buyWalletSkin(localStorage,fresh.walletKey,id,fresh.originalProfile,fresh.daily);
        renderSkinCatalog();
        if(!['ready','owned'].includes(result.status))el('skin-status').textContent='Purchase unavailable: '+result.status;
        else el('skin-status').textContent='Unlocked! Equip this skin.';
      }});
      return;
    }
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
        // Android 1.0 displays all six existing rival portraits across its 30
        // playable levels. Keep the 100-level world definitions and saves intact.
        const start = coreEdition ? i * 5 + 1 : world.start;
        const end = coreEdition ? Math.min((i + 1) * 5, campaignLimit) : world.end;
        const cleared = Boolean(profile?.stars?.[end]);
        const reached = Boolean(profile && profile.unlockedLevel >= start);
        const state = cleared ? 'defeated' : reached ? 'available' : 'locked';
        const current = state === 'available' && Boolean(profile) &&
            Math.min(profile.unlockedLevel, campaignLimit) >= start &&
            Math.min(profile.unlockedLevel, campaignLimit) <= end;
        for (const prefix of ['home-rival', 'career-rival-card']) {
            const card = el(prefix + '-' + i);
            const status = el(prefix + '-status-' + i);
            if (card) {
                // The full edition retains its established 100-level world map.
                // Only the Home strip uses the temporary Android Core mapping.
                const home = prefix === 'home-rival';
                const ownState = coreEdition ? state : (profile?.stars?.[world.end] ? 'defeated' :
                    profile && profile.unlockedLevel >= world.start ? 'available' : 'locked');
                card.hidden = false;
                card.dataset.state = ownState;
                card.dataset.current = String(home ? current : Boolean(profile && careerWorld(profile.unlockedLevel) === world));
                if (coreEdition) {
                    card.dataset.levels = start + '–' + end;
                    const levelLabel = card.querySelector?.('.rm-rival-levels');
                    if (levelLabel) levelLabel.textContent = 'Levels ' + start + '–' + end;
                    card.setAttribute('aria-label', world.rival + ', levels ' + start + ' to ' + end + ', ' +
                        (current ? 'current opponent' : ownState));
                }
            }
            if (status) status.textContent = coreEdition
                ? (state === 'defeated' ? 'Completed' : state === 'available' ? 'Current rival' : 'Locked')
                : state === 'defeated' ? 'Defeated' : state === 'available' ? 'Available' : 'Locked';
        }
    }
}
// Keep one source of truth for the Home counters. Non-Neon layouts use the
// original inline string; portrait Core Neon uses the number and caption.
function setHomeMetric(id, legacy, number) {
    const node = el(id);
    if (!node) return;
    node.querySelector('.rm-hud-legacy').textContent = legacy;
    node.querySelector('.rm-hud-number').textContent = number;
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
        'premium-career-count': summary ? summary.clearedLevels + ' / ' + campaignLimit : '',
    })) {
        if (id === 'premium-player-xp') setHomeMetric(id, value, profile ? profile.xp : '—');
        else if (id === 'premium-player-stars') setHomeMetric(id, value, summary ? '★ ' + summary.totalStars : '—');
        else el(id).textContent = value;
    }
    const coinCounter = el('premium-player-coins');
    if (coinCounter) {
        const economy = skinState().wallet;
        coinCounter.textContent = economy.status === 'ready'
            ? walletBalance(economy.wallet).toLocaleString('en-US')
            : '—';
    }
    const points = el('premium-brain-points');
    const daily = DailyProgress.read(localDateKey());
    if (points) setHomeMetric('premium-brain-points', daily.status === 'ready' ? daily.progress.brainPoints + ' Brain Points' : 'Brain Points unavailable', daily.status === 'ready' ? daily.progress.brainPoints : '—');
    const progress = el('premium-career-progress');
    progress.max = campaignLimit;
    progress.value = summary?.clearedLevels ?? 0;
}
function closeHomePreview() {
    if (!homePreviewSkin) return false;
    homePreviewSkin = null;
    const hub = el('home-hub');
    for (const area of hub.querySelectorAll('.home-hero, .home-actions')) area.inert = false;
    el('home-preview-bar').hidden = true;
    renderSkinVariables(activeSkin());
    const profile = visibleProfile(ProfileStore.read().profile);
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
    if (getSkin(previewSkinId).prestige || homePreviewSkin || el('skin-page').hidden || el('menu-page').hidden || ui.viewMenu.classList.contains('hidden')) return;
    stopSkinPreview();
    const skin = getSkin(previewSkinId);
    el('home-preview-bar').dataset.sourceSkin = activeSkin().id;
    homePreviewSkin = skin.id;
    const hub = el('home-hub');
    for (const area of hub.querySelectorAll('.home-hero, .home-actions')) area.inert = true;
    renderSkinVariables(skin);
    const profile = visibleProfile(ProfileStore.read().profile);
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
        renderCareerProgress(null);
        profileFeedback.textContent = state.status === 'invalid'
            ? 'Profile data could not be read. Reset only if you want to replace it.'
            : 'Profile storage is unavailable. Career progress cannot be saved.';
        el('career-start-btn').disabled = true;
        el('reset-career-btn').disabled = true;
        if(el('character-coins'))el('character-coins').textContent='Wallet unavailable';
        for(const card of document.querySelectorAll('[data-profile-avatar]')){
            card.disabled=true;card.dataset.entitlement='unknown';card.setAttribute('aria-pressed','false');
            const label=card.querySelector('[data-avatar-lock]');if(label){label.hidden=false;label.textContent='Unavailable';}
        }
        renderAvatarPage();
        refreshPremiumHome(null, null);
        return;
    }
    const p = visibleProfile(state.profile);
    if(!p)return;
    el('career-start-btn').disabled = false;
    el('reset-career-btn').disabled = false;
    profileName.value = p.name;
    const walletState=skinState().wallet, characterWallet=walletState.wallet;
    if(el('character-coins'))el('character-coins').textContent=walletState.status==='ready'?walletBalance(characterWallet)+' Coins':'Wallet unavailable';
    for(const option of avatarSelect.options){
        option.disabled=characterEntitlement(option.value,p,characterWallet)!=='owned';
    }
    avatarSelect.value = p.avatar;
    if(el('profile-avatar-name'))el('profile-avatar-name').textContent=getCharacter(p.avatar)?.label||'Spark';
    if (p.avatar === 'neon-fox') avatarPreview.classList.add('neon-fox');
    else avatarPreview.classList.remove('neon-fox');
    avatarPreview.dataset.avatar = p.avatar;
    avatarPreview.textContent = PLAYER_AVATARS.find(item => item.id === p.avatar)?.icon || '✨';
    for (const choice of document.querySelectorAll('[data-profile-avatar]')) {
        const id = choice.dataset.profileAvatar;
        const c=getCharacter(id);
        if(!c)continue;
        const entitlement=characterEntitlement(id,p,characterWallet);
        choice.disabled=entitlement!=='owned'&&(entitlement!=='coins'||walletState.status!=='ready');
        choice.dataset.entitlement=entitlement;
        choice.dataset.affordable=String(entitlement==='coins'&&walletState.status==='ready'&&walletBalance(characterWallet)>=c.price);
        choice.setAttribute('aria-pressed', String(id === p.avatar&&entitlement==='owned'));
        const lock=choice.querySelector('[data-avatar-lock]');
        if(lock){lock.textContent=id===p.avatar&&entitlement==='owned'?'Equipped':characterStatus(c,entitlement,characterWallet);lock.hidden=false;}
        choice.setAttribute('aria-label',c.label+', '+(id===p.avatar&&entitlement==='owned'?'Equipped':characterStatus(c,entitlement,characterWallet)));
    
    }
    renderAvatarPage();
    el('identity-name').textContent = p.name;
    el('identity-art').dataset.avatar = p.avatar;
    el('identity-art').textContent = '';
    const summary = careerSummary(p);
    if (coreEdition) {
        summary.achievements = summary.achievements.filter(({id}) =>
            !(id.startsWith('boss-') && Number(id.slice(5)) > campaignLimit) &&
            !(id.startsWith('stars-') && Number(id.slice(6)) > campaignLimit * 3));
        summary.earnedAchievements = summary.achievements.filter(item => item.earned).length;
    }
    refreshPremiumHome(p, summary);
    for (const [id, value] of Object.entries({
        'stat-played': summary.played,
        'stat-wins': summary.wins,
        'stat-draws': summary.draws,
        'stat-losses': summary.losses,
        'stat-win-rate': `${summary.winRate}%`,
        'stat-best-streak': summary.bestStreak,
        'stat-cleared': `${summary.clearedLevels} / ${campaignLimit}`,
        'stat-stars': `${summary.totalStars} / ${campaignLimit*3}`,
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
    if(achievementView)renderAchievementPage();
    careerXP.textContent = `${p.xp} XP`;
    renderCareerProgress(p);
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
    const full = slots.index.slots.length >= MAX_LOCAL_PLAYERS;
    el('create-local-player-btn').disabled = full;
    el('profile-create-toggle').disabled = full;
    if (full) el('profile-create-toggle').textContent = 'All ' + MAX_LOCAL_PLAYERS + ' player slots are in use';
    localPlayerSelect.innerHTML = slots.index.slots.map(id => {
        const p = ProfileStore.readSlot(id);
        const label = p.status === 'ready' || p.status === 'empty'
            ? p.profile.name : 'Unreadable player';
        return `<option value="${id}">${htmlText(label)}${id === 'guest' ? ' (Guest)' : ''}</option>`;
    }).join('');
    localPlayerSelect.value = slots.index.activeId;
    const chooser=el('rm-player-chooser');
    if(chooser){
        chooser.replaceChildren();
        for(const id of slots.index.slots){
            const p=ProfileStore.readSlot(id);
            const label=p.status==='ready'||p.status==='empty'?p.profile.name:'Unreadable player';
            const button=document.createElement('button');
            button.type='button';button.className='rm-player-option';
            button.textContent=label+(id==='guest'?' (Guest)':'');
            button.dataset.slot=id;
            button.setAttribute('aria-pressed',String(id===slots.index.activeId));
            button.disabled=localPlayerSelect.disabled;
            button.addEventListener('click',()=>{
                if(id===localPlayerSelect.value)return;
                localPlayerSelect.value=id;
                localPlayerSelect.dispatchEvent(new Event('change',{bubbles:true}));
            });
            chooser.append(button);
        }
    }
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
    const result = LocalSlots.createPlayer(newLocalPlayerName.value, el('new-local-player-avatar').value);
    if (result.status !== 'ready') {
        localPlayerFeedback.textContent = ({
            'bad-name': 'Enter a player name of 1–18 characters.',
            limit: 'All ' + MAX_LOCAL_PLAYERS + ' player slots are in use.',
            'duplicate-name': 'Choose a different player name.',
            invalid: 'Existing player data could not be read and was preserved.',
        })[result.status] || 'Unable to add player; existing data was preserved.';
        return;
    }
    setCreatePlayer(false);
    newLocalPlayerName.value = '';
    el('new-local-player-avatar').value = 'spark';
    renderStarterCharacter('new-local-player-avatar');
    updateActivePlayerView();
    localPlayerFeedback.textContent = profileName.value + ' is now the active player.';
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
document.addEventListener('click', event => {
    const control = event.target.closest?.('button, input[type="radio"], input[type="checkbox"], [role="button"]');
    if (!control || control.disabled || control.getAttribute('aria-disabled') === 'true') return;
    Native.vibrate('light');
    Game.playButtonSound();
}, true);
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
        const id=choice.dataset.profileAvatar,c=getCharacter(id);
        if(!c)return;
        const current=skinState(), entitlement=characterEntitlement(id,current.originalProfile,current.wallet.wallet);
        if(!current.originalProfile)return;
        if(entitlement==='owned'){
            avatarSelect.value=id;
            avatarSelect.onchange();
            return;
        }
        if(entitlement!=='coins')return;
        if(current.wallet.status!=='ready'){profileFeedback.textContent='Wallet unavailable. No purchase made.';return;}
        if(walletBalance(current.wallet.wallet)<c.price){
            profileFeedback.textContent='Need '+c.price+' Coins to unlock '+c.label+'.';return;
        }
        const owner=LocalSlots.read().index?.activeId;
        if(!owner)return;
        confirmDialog.open({
            heading:'Unlock '+c.label+'?',detail:'Spend '+c.price+' earned Coins on this cosmetic character?',
            confirmLabel:'Buy character',cancelLabel:'Cancel',focusReturn:choice,
            onConfirm:()=>{
                if(LocalSlots.read().index?.activeId!==owner)return;
                const fresh=skinState(),result=buyWalletCharacter(localStorage,fresh.walletKey,id,fresh.originalProfile,fresh.daily);
                refreshCareer();
                profileFeedback.textContent=['ready','owned'].includes(result.status)?'Unlocked '+c.label+'! Select again to equip.':'Purchase unavailable: '+result.status;
            }
        });
    };
});
careerSelect.onchange = () => {
    const stage = careerLevel(Number(careerSelect.value));
    drawOpening(el('mission-preview'), stage);
    const profile = visibleProfile(ProfileStore.read().profile);
    if (profile) renderRoute(profile, stage.level);
    careerDescription.textContent =
        missionFor(stage.level)?.clue ?? `Board ${stage.size} · ${stage.diff.toUpperCase()} AI · Win to unlock the next level`;
};
for (const [id, direction] of [['previous-chapter', -1], ['next-chapter', 1]]) {
    el(id).onclick = () => {
        const first = Math.floor((Number(careerSelect.value) - 1) / 5) * 5 + 1 + 5 * direction;
        const profile = visibleProfile(ProfileStore.read().profile);
        if (!profile || first < 1 || first > profile.unlockedLevel) return;
        careerSelect.value = String(first);
        careerSelect.onchange();
    };
}
function startSelectedCareer(sourceButton) {
    const level = Number(careerSelect.value);
    const state = ProfileStore.read();
    if (!['ready', 'empty'].includes(state.status) ||
        !Number.isInteger(level) || level < 1 || level > campaignLimit || level > state.profile.unlockedLevel) {
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
    askBeforeReplacing('Start Career?', 'This will replace your current saved match for this player. Career progress already earned remains safe.', startCareer, sourceButton);
}
el('career-start-btn').onclick=()=>startSelectedCareer(el('career-start-btn'));
bindPage('career-level-play',()=>startSelectedCareer(el('career-level-play')));

// Both new-player flows share the six free character IDs and the same art.
function starterCharacters(){return PLAYER_AVATARS.filter(item=>item.id!=='neon-fox');}
function renderStarterCharacter(id){
    const select=el(id),choices=starterCharacters();
    const index=Math.max(0,choices.findIndex(a=>a.id===select.value)),choice=choices[index];
    select.value=choice.id;
    const art=el(id+'-art'),name=el(id+'-name'),position=el(id+'-position');
    if(art)art.dataset.avatar=choice.id;
    if(name)name.textContent=choice.label;
    if(position)position.textContent=(index+1)+' / '+choices.length;
}
function stepStarterCharacter(id,delta){
    const select=el(id),choices=starterCharacters();
    const index=Math.max(0,choices.findIndex(a=>a.id===select.value));
    select.value=choices[(index+delta+choices.length)%choices.length].id;
    renderStarterCharacter(id);
}
for (const id of ['career-avatar', 'new-local-player-avatar']) {
    for (const avatar of PLAYER_AVATARS.filter(item => item.id !== 'neon-fox')) {
        const option = document.createElement('option');
        option.value = avatar.id;
        option.textContent = avatar.icon + ' ' + avatar.label;
        el(id).append(option);
    }
    el(id).value = 'spark';
    renderStarterCharacter(id);
    el(id).onchange=()=>renderStarterCharacter(id);
    bindPage(id+'-prev',()=>stepStarterCharacter(id,-1));
    bindPage(id+'-next',()=>stepStarterCharacter(id,1));
}
el('career-identity').onsubmit = event => {
    event.preventDefault();
    const result = ProfileStore.createCareerPlayer(el('career-name').value, el('career-avatar').value);
    if (result.status !== 'ready') {
        el('identity-status').textContent = result.status === 'bad-name' ? 'Choose a name of 1–18 characters.' : 'Could not save player.';
        return;
    }
    el('career-identity').hidden = true;
    setCareerScreen(1);
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
    el('career-skin-row').hidden = coreEdition || owned.length < 2;
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
    const radius=Math.floor(size/2);
    const playable=1+2*radius*(radius+1)-4;
    const summary=el('quick-match-summary');
    if(summary)summary.textContent=board+' · '+playable+' playable cells · '+(mode==='pvp'?'Local duel':difficulty+' AI');
    const preview = el('setup-preview');
    // Higher backing resolution without altering shared Renderer or board geometry.
    if (coreEdition && document.documentElement?.dataset?.skin === 'neon') {
        if (preview.width !== 480 || preview.height !== 480) {
            preview.width = preview.height = 480;
        }
    }
    drawOpening(preview, { size });
}
for (const button of document.querySelectorAll('[data-size],[data-ai],[data-diff]')) {
    button.onclick = () => {
        const previousSize = size;
        if (button.dataset.size) size = Number(button.dataset.size);
        if (button.dataset.ai) mode = button.dataset.ai;
        if (button.dataset.diff) diff = button.dataset.diff;
        renderQuickSetup();
        if (size !== previousSize && coreEdition &&
            document.documentElement?.dataset?.skin === 'neon' &&
            !el('menu-page').hidden && !el('quick-settings').hidden) {
            const preview = el('setup-preview');
            try {
                if (window.matchMedia?.('(prefers-reduced-motion: no-preference)')?.matches && preview.animate) {
                    for (const animation of preview.getAnimations?.() || []) {
                        if (animation.id === 'rm-quick-preview-change') animation.cancel();
                    }
                    const animation = preview.animate(
                        [{opacity:.78,transform:'scale(.97)'},{opacity:1,transform:'none'}],
                        {duration:180,easing:'ease-out'});
                    animation.id = 'rm-quick-preview-change';
                }
            } catch { /* Optional motion must never interrupt selection. */ }
        }
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
    Game.saveLocal();
    if (!Game.gameOver && Game.saveFailed) return;
    showHome();
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
    if (!current || (coreEdition && current >= campaignLimit)) return;
    const state = ProfileStore.read();
    if(current===CAREER_LEVEL_COUNT){
        if(!isInfinityResult()||state.status!=='ready'||!state.profile.stars?.[CAREER_LEVEL_COUNT])return;
        // Return through the normal match cleanup, then preselect the existing mode.
        // The player confirms Start in the Arena; persisted Infinity progress is reused.
        el('backMenuBtn').click();
        el('home-arcade').click();
        const infinity=el('arcade-infinity');
        if(infinity&&!infinity.disabled)infinity.click();
        return;
    }
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
        if (homePoints) setHomeMetric('premium-brain-points', 'Brain Points unavailable', '—');
        return;
    }
    el('daily-open-btn').disabled = false;
    el('daily-points').textContent = `${state.progress.brainPoints} Brain Points`;
    const homePoints = el('premium-brain-points');
    if (homePoints) setHomeMetric('premium-brain-points', state.progress.brainPoints + ' Brain Points', state.progress.brainPoints);
    el('daily-menu-status').textContent = state.progress.solved === 3
        ? 'View today’s result →'
        : `${state.progress.solved} of 3 complete`;
};

const drawDaily = () => {
    if (!dailyPuzzle || dailyCanvas.hidden) return;
    const width = Math.min(window.innerWidth - 32, 660);
    dailyRenderer.resize({
        clientWidth: width, clientHeight: Math.max(220, Math.min(window.innerHeight - 180, 720)),
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
    if(dailyModal.dataset)dailyModal.dataset.result='';
    dailyPuzzle = null;
    dailySolved = false;
    refreshDailyMenu();
};

const showDaily = () => {
    stopDailyEffects();
    if(dailyModal.dataset)dailyModal.dataset.result='';
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
        if(dailyModal.dataset)dailyModal.dataset.result='victory';
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
            if(dailyModal.dataset)dailyModal.dataset.result='defeat';
            dailyCanvas.hidden=true;
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
    if(dailyModal.dataset)dailyModal.dataset.result='victory';
    dailyCanvas.hidden=true;
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
        if (Game.gameOver) {
            el('menuBtn').click();
            return;
        }
        confirmDialog.open({
            heading: 'Return to Home?',
            detail: 'You can resume this match with Continue.',
            cancelLabel: 'Keep playing', confirmLabel: 'Save & return',
            onConfirm: () => el('menuBtn').click(), focusReturn: el('menuBtn'),
        });
    } else if (backSubpage() || closeSkinDetails()) {
        return;
    } else if (arcade?.back()) {
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


// Core launch: initialize the full UI and assets before revealing it.
// The temporary intro flag is set only here, once per document, never on Home return.
if (coreEdition) {
    const root=document.documentElement;
    let revealed=false;
    const reveal=()=>{
        if(revealed) return;
        revealed=true;
        // Optional motion must never prevent the initialized Home from becoming visible.
        let allowIntro=false;
        try {
            allowIntro=typeof window.matchMedia==='function' &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches===false;
        } catch { /* Unknown motion preference: skip the optional intro. */ }
        if(root.dataset.skin==='neon' && allowIntro) {
            root.dataset.rmIntro='1';
            let introTimer;
            const finishIntro=()=>{
                if(root.dataset.rmIntro!=='1') return;
                root.dataset.rmIntroSettled='1';
                delete root.dataset.rmIntro;
                clearTimeout(introTimer);
                document.removeEventListener('click',finishIntro,true);
            };
            // An early navigation click ends the effect without consuming the click.
            document.addEventListener('click',finishIntro,true);
            // SVG paths and their two moving light sources share a timeline.
            for(const motion of document.querySelectorAll?.('.rm-logo-trace animateMotion') || []) {
                try { motion.beginElement?.(); } catch { /* CSS still reveals the logo. */ }
            }
            introTimer=setTimeout(finishIntro,3250);
        }
        root.dataset.rmReady='1';
        clearTimeout(fallback);
    };
    const fallback=setTimeout(reveal,2000);
    const background=document.createElement('img');
    background.decoding='async';
    background.src='/assets/premium/master/neon-home-h6.webp';
    const arena=document.createElement('img');
    arena.decoding='async';
    arena.src='/assets/premium/master/neon-arena-v2.webp';
    const wordmark=document.querySelector('#premium-hero-stage .neon-home-brand > img');
    const decoded=[background,arena,wordmark].filter(Boolean).map(img=>{
        if (typeof img.decode !== 'function') return Promise.resolve();
        try {return img.decode().catch(()=>{});} catch {return Promise.resolve();}
    });
    Promise.all(decoded).then(reveal,reveal);
}
