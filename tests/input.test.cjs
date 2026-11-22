const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function boot({ storage = new Map(), autoStart = true, coreEdition = false, confirm = () => true } = {}) {
  const elements = new Map();
  const events = new Map();
  const nativeEvents = {};
  let exits = 0;
  function el(id) {
    if (elements.has(id)) return elements.get(id);
    const listeners = new Map(), classes = new Set();
    // Match src/index.html: the game view is hidden while the menu is open.
    if (id === 'view-game') classes.add('hidden');
    const element = {
      style: { setProperty(key, value) { this[key] = value; } },
      dataset: {}, children: [],
      get options() { return this.children; },
      querySelectorAll(selector) {
        if(selector==='[data-profile-avatar]')return this.children.filter(e=>e.dataset.profileAvatar!==undefined);
        return [];
      },
      querySelector(selector) {
        if(selector==='[data-avatar-lock]')return this.children.find(e=>e.dataset.avatarLock!==undefined)||null;
        if(selector==='.avatar-art')return this.children.find(e=>e.className==='avatar-art')||null;
        return null;
      },
      focus() {}, setAttribute(key,value) { this[key] = value; }, getAttribute(key) { return this[key] ?? null; },
      append(...nodes) { this.children.push(...nodes); }, appendChild(node) { this.children.push(node); return node; }, replaceChildren(...nodes) { this.children = nodes; },
      textContent: '', width: 400, height: 400,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400 }),
      classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x), toggle(x,force) {const on=force===undefined?!classes.has(x):Boolean(force); if(on)classes.add(x);else classes.delete(x);return on;} },
      addEventListener(type, fn) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(fn);
      },
      dispatch(type, event) { for (const fn of listeners.get(type) || []) fn(event); },
      click() { this.onclick?.(); },
    };
    elements.set(id, element);
    return element;
  }
  const pages = Object.entries({ startBtn: 'quick-settings', career: 'career-page', profile: 'player-settings', 'home-skin-store':'skin-page' }).map(([id,page]) => {
    const button = el(id);
    button.id = id;
    button.dataset.page = page;
    return button;
  });
  const avatarGrid=el('character-grid');
  const setupButtons=[];
  for(const [key,values] of [['size',['4','6','8','10']],['ai',['ai','pvp']],['diff',['easy','normal','hard']]]){
    for(const value of values){const button=el('setup-'+key+'-'+value);button.dataset[key]=value;setupButtons.push(button);}
  }
  const context = vm.createContext({
    console,
    window: { devicePixelRatio: 1, innerWidth:412, innerHeight:860, addEventListener(type, callback) { events.set(type, callback); }, confirm },
    document: { documentElement: coreEdition ? Object.assign(el("root"), {dataset: {edition: "core"}}) : undefined, hidden: false, createElement: () => el(Symbol()), getElementById: el,
      querySelector: selector=>selector==='.premium-avatar-grid'?avatarGrid:null,
      querySelectorAll: selector=>{
        if(selector==='[data-page]')return pages;
        if(selector==='[data-profile-avatar]')return avatarGrid.children;
        if(selector==='[data-size],[data-ai],[data-diff]')return setupButtons;
        if(['[data-size]','[data-ai]','[data-diff]'].includes(selector))return setupButtons.filter(e=>e.dataset[selector.slice(6,-1)]!==undefined);
        return [];
      },
      addEventListener(type, callback) { events.set(type, callback); } },
    localStorage: { getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    requestAnimationFrame() { return 1; }, cancelAnimationFrame() {}, setTimeout: () => 1, clearTimeout() {},
  });
  const modules = new Map();
  const stubs = {
    'native.js': { Native: { init() {}, vibrate() {}, setHapticsEnabled(enabled) { nativeEvents.hapticsEnabled = enabled; }, onBack(callback) { nativeEvents.back = callback; }, onStateChange(callback) { nativeEvents.state = callback; }, exit() { exits++; } } },
    'audio.js': { AudioController: class { init() {} move() {} score() {} win() {} pause() {} resume() {} } },
    'renderer.js': { Renderer: class {
      constructor(canvas) { this.canvas = canvas; this.CELL = 40; this.offX = 0; this.offY = 0; this.particles = []; }
      resize() {} spawnParticles() {} draw() {}
    } },
  };
  function load(filename) {
    if (modules.has(filename)) return modules.get(filename);
    // Vite bundles styles separately from the JavaScript module graph.
    const stub = filename.endsWith('.css') ? {} : stubs[path.basename(filename)];
    const mod = stub ? new vm.SyntheticModule(Object.keys(stub), function () {
      for (const [key, value] of Object.entries(stub)) this.setExport(key, value);
    }, { context, identifier: filename }) : new vm.SourceTextModule(fs.readFileSync(filename, 'utf8'), { context, identifier: filename });
    modules.set(filename, mod);
    return mod;
  }
  const main = load(path.resolve(__dirname, '../src/main.js'));
  await main.link((specifier, parent) => load(path.resolve(path.dirname(parent.identifier), specifier)));
  await main.evaluate();
  const game = modules.get(path.resolve(__dirname, '../src/game.js')).namespace.Game;
  if (autoStart) game.start(6, 'pvp', 'normal');
  const move = game.board?.getFreeMoves()[0] || { t: 'h', r: 1, c: 3 };
  const event = {
    isPrimary: true, button: 0, pointerType: 'mouse', preventDefault() {},
    clientX: (move.c + (move.t === 'h' ? 0.5 : 0)) * 40,
    clientY: (move.r + (move.t === 'v' ? 0.5 : 0)) * 40,
  };
  return { game, el, event, storage, events, nativeEvents, context, get exits() { return exits; }, canvas: el('canvas') };
}

for (const pointerType of ['mouse', 'touch', 'pen']) {
  test(`${pointerType}: one gesture produces exactly one move through the application entry point`, async () => {
    const h = await boot();
    let calls = 0;
    const process = h.game.processInput.bind(h.game);
    h.game.processInput = (...args) => { calls++; return process(...args); };
    const event = { ...h.event, pointerType };
    h.canvas.dispatch('pointerdown', event);
    // Compatibility events must neither duplicate input nor call the removed handleInput.
    h.canvas.dispatch('touchstart', { ...event, touches: [event] });
    h.canvas.dispatch('mousedown', event);
    h.canvas.dispatch('click', event);
    assert.equal(calls, 1);
    assert.equal(h.game.historyStack.length, 1);
  });
}

test('secondary touches, right click and middle click cannot place a line', async () => {
  const h = await boot();
  for (const override of [{ isPrimary: false, pointerType: 'touch' }, { button: 1 }, { button: 2 }]) {
    h.canvas.dispatch('pointerdown', { ...h.event, ...override });
  }
  assert.equal(h.game.historyStack.length, 0);
});

test('AI turn, thinking and stopped-game guards still block pointer input', async () => {
  const h = await boot();
  h.game.settings.mode = 'ai';
  h.game.player = 0;
  h.canvas.dispatch('pointerdown', h.event);
  h.game.player = 1;
  h.game.aiThinking = true;
  h.canvas.dispatch('pointerdown', h.event);
  h.game.aiThinking = false;
  h.game.stop();
  h.canvas.dispatch('pointerdown', h.event);
  assert.equal(h.game.historyStack.length, 0);
});

test('restarts do not add extra input handlers', async () => {
  const h = await boot();
  for (let i = 0; i < 5; i++) h.el('restartBtn').click();
  let calls = 0;
  h.game.processInput = () => calls++;
  h.canvas.dispatch('pointerdown', h.event);
  assert.equal(calls, 1);
});

test('menu and Continue retain the game, and a declined new game preserves the save', async () => {
  const h = await boot({ confirm: () => false });
  h.canvas.dispatch('pointerdown', h.event);
  const board = JSON.stringify(h.game.board);
  const raw = h.storage.get('rhombus_save');
  h.el('menuBtn').click();
  assert.equal(h.game.gameOver, true);
  assert.equal(h.el('continueBtn').hidden, false);
  h.el('setup-play').click();
  assert.equal(h.el('confirm-dialog').hidden, false);
  assert.equal(h.storage.get('rhombus_save'), raw);
  h.el('confirm-dialog-cancel').click();
  assert.equal(h.el('confirm-dialog').hidden, true);
  assert.equal(h.storage.get('rhombus_save'), raw);
  assert.equal(h.game.gameOver, true);
  h.el('continueBtn').click();
  assert.equal(h.game.gameOver, false);
  assert.equal(JSON.stringify(h.game.board), board);
  h.el('restartBtn').click();
  assert.equal(h.el('confirm-dialog').hidden, false);
  h.nativeEvents.back();
  assert.equal(h.el('confirm-dialog').hidden, true);
  assert.equal(JSON.stringify(h.game.board), board);
});

test('Continue after reload uses saved settings for restart and rematch', async () => {
  const first = await boot();
  first.game.start(8, 'pvp', 'hard');
  first.game.executeMove(first.game.board.getFreeMoves()[0]);
  const h = await boot({ storage: first.storage, autoStart: false });
  assert.equal(h.el('continueBtn').hidden, false);
  h.el('continueBtn').click();
  assert.equal(h.game.settings.size, 8);
  h.el('restartBtn').click();
  assert.equal(h.el('confirm-dialog').hidden, false);
  h.el('confirm-dialog-accept').click();
  assert.equal(h.game.settings.size, 8);
  assert.equal(h.game.settings.mode, 'pvp');
  assert.equal(h.game.settings.diff, 'hard');
  assert.equal(h.game.historyStack.length, 0);
  h.el('againBtn').click();
  assert.equal(h.game.settings.size, 8);
});

test('Back closes help first, then saves to menu, then confirms Android exit from home', async () => {
  const h = await boot();
  h.canvas.dispatch('pointerdown', h.event);
  h.el('help-modal').classList.add('flex');
  h.nativeEvents.back();
  assert.equal(h.el('help-modal').classList.contains('flex'), false);
  assert.equal(h.game.gameOver, false);
  assert.equal(h.exits, 0);
  h.nativeEvents.back();
  assert.equal(h.game.gameOver, true);
  assert.equal(h.el('continueBtn').hidden, false);
  assert.equal(h.exits, 0);
  h.nativeEvents.back();
  assert.equal(h.el('confirm-dialog-title').textContent, 'Exit RombMaster?');
  assert.equal(h.exits, 0);
  h.el('confirm-dialog-cancel').click();
  assert.equal(h.el('confirm-dialog').hidden, true);
  h.nativeEvents.back();
  h.nativeEvents.back();
  assert.equal(h.el('confirm-dialog').hidden, true);
  assert.equal(h.exits, 0);
  h.nativeEvents.back();
  h.el('confirm-dialog-accept').click();
  assert.equal(h.exits, 1);
});

test('Back closes result without leaving a blocking overlay on the menu', async () => {
  const h = await boot();
  h.el('overlay').classList.add('flex');
  h.nativeEvents.back();
  assert.equal(h.el('overlay').classList.contains('flex'), false);
  assert.equal(h.el('view-game').classList.contains('hidden'), false);
  h.nativeEvents.back();
  assert.equal(h.el('view-game').classList.contains('hidden'), true);
});

test('native, visibility and page events all feed the same pause controller', async () => {
  const h = await boot();
  h.nativeEvents.state({ isActive: false });
  h.context.document.hidden = true;
  h.events.get('visibilitychange')();
  h.events.get('pagehide')();
  h.nativeEvents.state({ isActive: true });
  h.context.document.hidden = false;
  h.events.get('visibilitychange')();
  assert.equal(h.game.paused, true);
  h.events.get('pageshow')();
  assert.equal(h.game.paused, false);
});


test('hover previews a legal line without committing it and clears on leave', async () => {
  const h = await boot();
  const before = JSON.stringify(h.game.board);
  h.canvas.dispatch('pointermove', { ...h.event, buttons: 0 });
  // The application runs inside a separate VM context in this harness.
  // Normalize BOTH moves to plain JSON before strict structural comparison;
  // otherwise identical coordinates fail due to cross-realm prototypes.
  const normalize = move => JSON.parse(JSON.stringify(move));
  assert.deepStrictEqual(normalize(h.game.hoverMove), normalize(h.game.board.getFreeMoves()[0]));
  assert.equal(JSON.stringify(h.game.board), before);
  assert.equal(h.game.historyStack.length, 0);
  h.canvas.dispatch('pointerleave', {});
  assert.equal(h.game.hoverMove, null);
});

test('help tutorial moves between steps without changing match or save', async () => {
  const h = await boot();
  const beforeBoard = JSON.stringify(h.game.board);
  const beforeSave = h.storage.get('rhombus_save');
  h.el('helpBtn').click();
  assert.equal(h.el('tutorial-count').textContent, 'Step 1 of 4');
  h.el('tutorial-next').click();
  assert.equal(h.el('tutorial-count').textContent, 'Step 2 of 4');
  h.el('tutorial-back').click();
  assert.equal(h.el('tutorial-count').textContent, 'Step 1 of 4');
  for (let i = 0; i < 4; i++) h.el('tutorial-next').click();
  assert.equal(h.el('help-modal').classList.contains('flex'), false);
  assert.equal(JSON.stringify(h.game.board), beforeBoard);
  assert.equal(h.storage.get('rhombus_save'), beforeSave);
});


test('avatar choice persists through the real application menu without changing a game save', async () => {
  const h = await boot();
  const matchSave = h.storage.get('rhombus_save');
  const cards=h.el('character-grid').children;
  assert.equal(cards.length,25);
  const dragon=cards.find(card=>card.dataset.profileAvatar==='dragon');
  assert.ok(dragon&&!dragon.disabled&&!dragon.hidden);
  dragon.click();
  const profile = JSON.parse(h.storage.get('rombmaster_profile_v1'));
  assert.equal(profile.avatar, 'dragon');
  assert.equal(profile.stats.played, 0);
  assert.equal(h.storage.get('rhombus_save'), matchSave);
  assert.equal(h.el('profile-avatar-preview').textContent, '🐉');
});

test('statistics from local Career can be displayed without network or a login', async () => {
  const profile = JSON.stringify({
    version: 1, name: 'Veteran', xp: 300, unlockedLevel: 2,
    stars: { 1: 3 },
    stats: { played: 3, wins: 2, draws: 0, losses: 1 },
  });
  const h = await boot({ storage: new Map([['rombmaster_profile_v1', profile]]) });
  assert.equal(h.el('stat-played').textContent, '3');
  assert.equal(h.el('stat-wins').textContent, '2');
  assert.equal(h.el('stat-win-rate').textContent, '67%');
  assert.equal(h.el('stat-stars').textContent, '3 / 300');
  assert.equal(h.el('achievement-count').textContent, '1 / 24');
});


test('daily practice can be opened and dismissed without replacing a saved match', async () => {
  const h = await boot();
  const initialBoard = JSON.stringify(h.game.board);
  const save = h.storage.get('rhombus_save');
  h.el('daily-open-btn').click();
  assert.equal(h.el('daily-modal').hidden, false);
  assert.equal(h.el('daily-step').textContent, 'Challenge 1 of 3');
  h.nativeEvents.back();
  assert.equal(h.el('daily-modal').hidden, true);
  assert.equal(h.exits, 0);
  assert.equal(JSON.stringify(h.game.board), initialBoard);
  assert.equal(h.storage.get('rhombus_save'), save);
});

test('Career reset requires a styled confirmation and preserves Quick and Daily saves', async () => {
  const h = await boot({ autoStart: false });
  h.el('profile-name').value = 'Pilot';
  h.el('save-profile-btn').click();
  h.el('profile-avatar').value = 'fox';
  h.el('profile-avatar').onchange();
  const quick = 'quick-save-sentinel';
  // Use a valid quick match save instead of an arbitrary malformed value.
  h.game.start(6, 'pvp', 'normal');
  h.el('menuBtn').click();
  const quickSave = h.storage.get('rhombus_save');
  h.storage.set('rombmaster_daily_progress_v1', 'daily-sentinel');
  h.el('reset-career-btn').click();
  assert.equal(h.el('career-reset-modal').hidden, false);
  h.el('career-reset-cancel').click();
  assert.equal(h.el('career-reset-modal').hidden, true);
  h.el('reset-career-btn').click();
  h.el('career-reset-confirm').click();
  const profile = JSON.parse(h.storage.get('rombmaster_profile_v1'));
  assert.equal(profile.name, 'Pilot');
  assert.equal(profile.avatar, 'fox');
  assert.equal(profile.unlockedLevel, 1);
  assert.equal(profile.xp, 0);
  assert.equal(h.storage.get('rhombus_save'), quickSave);
  assert.equal(h.storage.get('rombmaster_daily_progress_v1'), 'daily-sentinel');
});

test('Career reset is blocked by unfinished saved Career and malformed saves', async () => {
  const h = await boot({ autoStart: false });
  h.el('career-start-btn').click();
  h.el('menuBtn').click();
  const savedCareer = h.storage.get('rhombus_save');
  h.el('reset-career-btn').click();
  assert.equal(h.el('career-reset-modal').hidden, true);
  assert.equal(h.storage.get('rhombus_save'), savedCareer);
  assert.match(h.el('profile-feedback').textContent, /saved Career game/);
  h.storage.set('rhombus_save', '{bad save');
  h.el('reset-career-btn').click();
  assert.equal(h.el('career-reset-modal').hidden, true);
});

test('Android Back cancels styled Career reset without changing profile', async () => {
  const h = await boot({ autoStart: false });
  h.el('save-profile-btn').click();
  const before = h.storage.get('rombmaster_profile_v1');
  h.el('reset-career-btn').click();
  assert.equal(h.el('career-reset-modal').hidden, false);
  h.nativeEvents.back();
  assert.equal(h.el('career-reset-modal').hidden, true);
  assert.equal(h.storage.get('rombmaster_profile_v1'), before);
  assert.equal(h.exits, 0);
});

test('multiple local players keep match saves and Career progress independent', async () => {
  const h = await boot({ autoStart: false });
  h.el('profile-name').value = 'Veteran';
  h.el('save-profile-btn').click();
  h.game.start(6, 'pvp', 'normal');
  h.el('menuBtn').click();
  const guestSave = h.storage.get('rhombus_save');
  const guestProfile = h.storage.get('rombmaster_profile_v1');

  h.el('new-local-player-avatar').value = 'robot';
  h.el('new-local-player-name').value = 'Lina';
  h.el('create-local-player-btn').click();
  assert.equal(h.el('local-player-select').value, 'slot-1');
  assert.equal(h.el('profile-name').value, 'Lina');
  assert.equal(h.el('profile-avatar').value, 'robot');
  assert.equal(h.el('career-progress').textContent, '0 / 100 levels cleared · Level 1 unlocked');
  assert.equal(h.el('career-clear-progress').max, 100);
  assert.equal(h.el('career-clear-progress').value, 0);
  const linaProfile = JSON.parse(h.storage.get('rombmaster_profile_v1:slot-1'));
  assert.equal(linaProfile.unlockedLevel, 1);
  assert.deepEqual(linaProfile.stars, {});
  assert.equal(h.el('continueBtn').hidden, true);
  h.game.start(4, 'pvp', 'normal');
  h.el('menuBtn').click();
  const linaSave = h.storage.get('rhombus_save:slot-1');
  assert.ok(linaSave);

  h.el('local-player-select').value = 'guest';
  h.el('local-player-select').onchange();
  assert.equal(h.el('profile-name').value, 'Veteran');
  assert.equal(h.el('continueBtn').hidden, false);
  assert.equal(h.storage.get('rhombus_save'), guestSave);
  assert.equal(h.storage.get('rombmaster_profile_v1'), guestProfile);
  h.el('local-player-select').value = 'slot-1';
  h.el('local-player-select').onchange();
  assert.equal(h.storage.get('rhombus_save:slot-1'), linaSave);
  assert.equal(h.el('continueBtn').hidden, false);
});

test('new player names are escaped in the player selector', async () => {
  const h = await boot({ autoStart: false });
  h.el('new-local-player-name').value = '<img src=x>';
  h.el('create-local-player-btn').click();
  assert.equal(h.el('local-player-select').value, 'slot-1');
  assert.equal(JSON.parse(h.storage.get('rombmaster_profile_v1:slot-1')).name, '<img src=x>');
  assert.match(h.el('local-player-select').innerHTML, /&lt;img src=x&gt;/);
  assert.doesNotMatch(h.el('local-player-select').innerHTML, /<img/);
});

test('creating local players does not overwrite existing guest daily progress', async () => {
  const h = await boot({ autoStart: false });
  h.storage.set('rombmaster_daily_progress_v1', '{"guest":"unchanged"}');
  h.el('new-local-player-name').value = 'Mila';
  h.el('create-local-player-btn').click();
  assert.equal(h.el('local-player-select').value, 'slot-1');
  assert.equal(JSON.parse(h.storage.get('rombmaster_profile_v1:slot-1')).name, 'Mila');
  assert.equal(h.storage.get('rombmaster_daily_progress_v1'), '{"guest":"unchanged"}');
  assert.equal(h.storage.get('rombmaster_daily_progress_v1:slot-1'), undefined);
  assert.equal(h.el('daily-open-btn').disabled, false);
});

test('malformed player registry blocks new player creation without mutation', async () => {
  const storage = new Map([['rombmaster_player_slots_v1', '{broken']]);
  const h = await boot({ storage, autoStart: false });
  assert.equal(h.el('create-local-player-btn').disabled, true);
  const before = storage.get('rombmaster_player_slots_v1');
  h.el('new-local-player-name').value = 'Mila';
  h.el('create-local-player-btn').click();
  assert.equal(storage.get('rombmaster_player_slots_v1'), before);
  assert.equal(storage.has('rombmaster_profile_v1:slot-1'), false);
});

test('new game confirmation keeps original save on Android Back and replaces it once on accept', async () => {
  const h = await boot();
  h.canvas.dispatch('pointerdown', h.event);
  const saved = h.storage.get('rhombus_save');
  const originalBoard = JSON.stringify(h.game.board);
  h.el('menuBtn').click();
  h.el('setup-play').click();
  assert.equal(h.el('confirm-dialog').hidden, false);
  assert.equal(h.el('confirm-dialog-title').textContent, 'Start New Game?');
  h.nativeEvents.back();
  assert.equal(h.el('confirm-dialog').hidden, true);
  assert.equal(h.storage.get('rhombus_save'), saved);
  assert.equal(h.exits, 0);
  h.el('setup-play').click();
  h.el('confirm-dialog-accept').click();
  assert.equal(h.game.gameOver, false);
  assert.notEqual(JSON.stringify(h.game.board), originalBoard);
  assert.equal(h.game.moveLog.length, 0);
  assert.equal(h.el('confirm-dialog').hidden, true);
  const newSave = h.storage.get('rhombus_save');
  h.el('confirm-dialog-accept').click();
  assert.equal(h.storage.get('rhombus_save'), newSave);
});

test('Career confirmation does not erase the saved Quick match when canceled', async () => {
  const h = await boot({ autoStart: false });
  h.game.start(6, 'pvp', 'normal');
  h.el('menuBtn').click();
  const quickSave = h.storage.get('rhombus_save');
  h.el('career-start-btn').click();
  assert.equal(h.el('confirm-dialog').hidden, false);
  assert.equal(h.el('confirm-dialog-title').textContent, 'Start Career?');
  h.el('confirm-dialog-cancel').click();
  assert.equal(h.storage.get('rhombus_save'), quickSave);
  assert.equal(h.el('confirm-dialog').hidden, true);
});

test('Restart confirmation pauses active game, cancels with Back and commits only on accept', async () => {
  const h = await boot();
  h.canvas.dispatch('pointerdown', h.event);
  const before = JSON.stringify(h.game.board);
  const saveBefore = h.storage.get('rhombus_save');
  h.el('restartBtn').click();
  assert.equal(h.el('confirm-dialog').hidden, false);
  assert.equal(h.game.paused, true);
  h.nativeEvents.back();
  assert.equal(h.el('confirm-dialog').hidden, true);
  assert.equal(h.game.paused, false);
  assert.equal(JSON.stringify(h.game.board), before);
  assert.equal(h.storage.get('rhombus_save'), saveBefore);
  h.el('restartBtn').click();
  h.el('confirm-dialog-accept').click();
  assert.equal(h.game.historyStack.length, 0);
  assert.equal(h.game.paused, false);
  assert.equal(h.el('confirm-dialog').hidden, true);
});

test('creating a player during an active game is blocked without storage changes', async () => {
  const h = await boot();
  const before = [...h.storage.entries()];
  h.el('new-local-player-name').value = 'Lina';
  h.el('create-local-player-btn').click();
  assert.match(h.el('local-player-feedback').textContent, /Close the current game/);
  assert.deepEqual([...h.storage.entries()], before);
  assert.equal(h.storage.has('rombmaster_profile_v1:slot-1'), false);
});


test('sound and vibration choices persist independently after reopening the menu', async () => {
  const first = await boot({ autoStart: false });
  first.el('haptics-toggle').checked = false;
  first.el('haptics-toggle').onchange();
  assert.equal(first.nativeEvents.hapticsEnabled, false);
  const second = await boot({ autoStart: false, storage: first.storage });
  assert.equal(second.el('sound-toggle').checked, true);
  assert.equal(second.nativeEvents.hapticsEnabled, false);
  second.el('sound-toggle').checked = false;
  second.el('sound-toggle').onchange();
  assert.deepEqual(JSON.parse(first.storage.get('rombmaster.comfort.v1')), { sound: false, haptics: false });
});

test('guided capture teaches the winning point without replacing the saved game', async () => {
  const h = await boot();
  const before = [...h.storage.entries()];
  h.el('helpBtn').click();
  for (let i = 0; i < 3; i++) h.el('tutorial-next').click();
  assert.equal(h.el('tutorial-play').hidden, false);
  h.el('tutorial-play').click();
  assert.equal(h.el('tutorial-step-title').textContent, 'You won 1–0!');
  assert.equal(h.el('tutorial-play').hidden, true);
  h.el('tutorial-next').click();
  h.el('helpBtn').click();
  for (let i = 0; i < 3; i++) h.el('tutorial-next').click();
  assert.equal(h.el('tutorial-play').hidden, false);
  assert.deepEqual([...h.storage.entries()], before);
});


test('in-match sound control immediately syncs the preference, persists and never changes the board or haptics', async () => {
  const h = await boot();
  const board = h.game.board;
  const before = JSON.stringify(board);
  const saves = [...h.storage.entries()].filter(([key]) => key !== 'rombmaster.comfort.v1');
  assert.equal(h.el('game-sound-btn')['aria-pressed'], 'true');
  h.el('game-sound-btn').click();
  assert.equal(h.el('game-sound-btn')['aria-pressed'], 'false');
  assert.equal(h.el('game-sound-label').textContent, 'Sound off');
  assert.equal(h.el('sound-toggle').checked, false);
  assert.equal(h.nativeEvents.hapticsEnabled, true);
  assert.equal(h.game.board, board);
  assert.equal(JSON.stringify(board), before);
  assert.deepEqual([...h.storage.entries()].filter(([key]) => key !== 'rombmaster.comfort.v1'), saves);
  const next = await boot({ autoStart:false, storage:h.storage });
  assert.equal(next.el('game-sound-btn')['aria-pressed'], 'false');
  next.el('game-sound-btn').click();
  assert.equal(next.el('sound-toggle').checked, true);
  assert.equal(next.el('game-sound-label').textContent, 'Sound on');
  assert.deepEqual(JSON.parse(h.storage.get('rombmaster.comfort.v1')), {sound:true,haptics:true});
});

test('Quick Play local multiplayer selection remembers the mode after starting', async () => {
  const h = await boot({ autoStart: false });
  h.el('startBtn').click();
  assert.equal(h.el('quick-settings').hidden, false);
  h.el('setup-ai-pvp').click();
  assert.equal(h.el('difficulty-wrapper').hidden, true);
  assert.equal(h.storage.has('rhombus_save'), false);
  h.el('setup-play').click();
  assert.equal(h.game.settings.mode, 'pvp');
  const resumed = await boot({ storage: h.storage, autoStart: false });
  resumed.el('startBtn').click();
  assert.equal(resumed.el('difficulty-wrapper').hidden, true);
  assert.equal(JSON.parse(h.storage.get('rombmaster_quick_setup')).mode, 'pvp');
});

test('Career introduces a fresh player once and preserves an existing quick match during setup', async () => {
  const h = await boot();
  h.el('menuBtn').click();
  const original = h.storage.get('rhombus_save');
  h.el('career').click();
  assert.equal(h.el('career-identity').hidden, false);
  h.el('career-name').value = 'Ace';
  h.el('career-avatar').value = 'robot';
  h.el('career-identity').onsubmit({ preventDefault() {} });
  assert.equal(h.el('career-identity').hidden, true);
  assert.equal(JSON.parse(h.storage.get('rombmaster_profile_v1')).avatar, 'robot');
  h.el('page-back').click();
  h.el('career').click();
  assert.equal(h.el('career-identity').hidden, true);
  assert.equal(h.el('confirm-dialog').hidden, true);
  assert.equal(h.storage.get('rhombus_save'), original);
});

test('closed test starts with a scoring hint, resumes the same move and offers Royal as a preview', async () => {
  const first = await boot({coreEdition: true, autoStart: false});
  first.el('startBtn').click();
  assert.equal(first.game.settings.careerLevel, 1);
  const move = first.game.firstCaptureHint();
  assert.ok(move);
  first.game.executeMove(move);
  assert.ok(first.game.board.score[1] > 0);
  const next = await boot({coreEdition: true, autoStart: false, storage: first.storage});
  assert.equal(next.el('continueBtn').hidden, false);
  next.el('continueBtn').click();
  assert.deepEqual({...next.game.lastMove}, {...move});
  next.el('home-skin-store').click();
  assert.deepEqual(Array.from(next.el('skin-options').children, node => node.dataset.skinId), ['neon','royal']);
  next.el('skin-options').children[1].click();
  assert.equal(next.el('skin-equip').disabled, true);
});

test('closed test caps the route without rewriting a veteran profile', async () => {
  const profile = JSON.stringify({version: 1, name: 'Veteran', xp: 300, unlockedLevel: 45,
    stars: {1: 3, 40: 2}, stats: {played: 3, wins: 2, draws: 0, losses: 1}});
  const storage = new Map([['rombmaster_profile_v1', profile]]);
  const h = await boot({coreEdition: true, storage, autoStart: false});
  h.el('career').click();
  assert.equal(h.el('career-level').value, '30');
  assert.equal(h.el('next-chapter').disabled, true);
  assert.equal(h.el('stat-stars').textContent, '3 / 90');
  assert.equal(storage.get('rombmaster_profile_v1'), profile);
});
