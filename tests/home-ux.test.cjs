const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.resolve(__dirname, '../src/index.html'), 'utf8');
const css = fs.readFileSync(path.resolve(__dirname, '../src/style.css'), 'utf8');
const mark = fs.readFileSync(path.resolve(__dirname, '../src/brand-neon.webp'));
const count = id => (html.match(new RegExp('id="' + id + '"', 'g')) || []).length;

test('home menu prioritizes play choices and keeps them unique', () => {
  for (const id of ['continueBtn', 'startBtn', 'career-start-btn', 'daily-open-btn', 'helpBtn']) {
    assert.equal(count(id), 1, id);
  }
  assert.ok(html.indexOf('id="startBtn"') < html.indexOf('id="quick-settings"'));
  assert.ok(html.indexOf('id="daily-open-btn"') < html.indexOf('id="player-settings"'));
  assert.ok(html.includes('src="./brand-neon.webp"'));
});

test('existing local controls survive the presentation refresh', () => {
  for (const id of ['profile-name', 'local-player-select', 'new-local-player-name',
    'create-local-player-btn','save-profile-btn','profile-avatar','player-stats',
    'career-level','career-progress','reset-career-btn','daily-menu-status','daily-points',
    'save-status','confirm-dialog']) {
    assert.equal(count(id), 1, id);
  }
  for (const key of ['data-size="4"', 'data-size="6"', 'data-size="8"',
    'data-ai="pvp"', 'data-ai="ai"', 'data-diff="easy"',
    'data-diff="normal"', 'data-diff="hard"']) assert.ok(html.includes(key), key);
});

test('home uses touch sized targets, focus outlines and neon branding', () => {
  assert.match(css, /home-play\s*\{[^}]*min-height:\s*56px/);
  assert.match(css, /summary:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.equal(mark.toString('ascii', 0, 4), 'RIFF');
  assert.equal(mark.toString('ascii', 8, 12), 'WEBP');
});

test('premium home uses original brand and active profile progress', () => {
  const main = fs.readFileSync(path.resolve(__dirname, '../src/main.js'), 'utf8');
  const skins = fs.readFileSync(path.resolve(__dirname, '../src/skins.js'), 'utf8');
  for (const id of ['premium-home-progress','premium-player-name','premium-player-xp','premium-player-stars','premium-rival-icon','premium-rival-name','premium-world-name','premium-world-level','premium-career-count','premium-career-progress']) {
    assert.equal(count(id), 1, id);
    assert.ok(main.includes(id), id);
  }
  assert.match(main, /refreshPremiumHome\(p, summary\)/);
  assert.match(main, /refreshPremiumHome\(null, null\)/);
  assert.match(main, /progress\.value = summary\?\.clearedLevels/);
  assert.match(skins, /'neon','Neon Arena','Included','#071729','#FB7185','#22D3EE'/);
  assert.ok(css.includes(':root[data-skin="neon"] #home-hub [hidden]'));
  assert.ok(css.includes('.premium-home-progress[hidden]'));
  assert.match(main, /panel\.hidden = !profile \|\| !summary;/);
});

test('premium home and Career expose six actual local rival portraits and preserve profile locks', () => {
  const main = fs.readFileSync(path.resolve(__dirname, '../src/main.js'), 'utf8');
  for (const [i, name] of ['rookie','trickster','predator','phantom','grandmaster','omega'].entries()) {
    assert.ok(fs.existsSync(path.resolve(__dirname, '../src/public/assets/premium/rivals', name + '.webp')), name);
    assert.ok(html.includes('/assets/premium/rivals/' + name + '.webp'), name);
    assert.equal(count('home-rival-' + i), 1);
    assert.equal(count('career-rival-card-' + i), 1);
  }
  assert.equal(count('premium-hero-board'), 1);
  assert.match(main, /profile\?\.stars\?\.\[world\.end\]/);
  assert.match(main, /profile\.unlockedLevel >= world\.start/);
  assert.match(css, /#helpBtn \.hub-glyph\s*\{[^}]*flex:0 0 22px/);
  assert.match(html, /<span>How to play<\/span>/);
});

test('all home themes share one real interface; preview cannot equip or save a skin', () => {
  const main = fs.readFileSync(path.resolve(__dirname, '../src/main.js'), 'utf8');
  assert.equal(count('skin-home-preview'), 1);
  assert.equal(count('home-preview-close'), 1);
  assert.equal(count('premium-brain-points'), 1);
  assert.ok(html.includes('data-layout="premium"'));
  const preview = main.slice(main.indexOf("el('skin-home-preview').onclick"), main.indexOf("el('home-preview-close').onclick"));
  assert.match(preview, /renderSkinVariables\(skin\)/);
  assert.match(preview, /area\.inert = true/);
  assert.doesNotMatch(preview, /setActiveSkin|saveSkin|localStorage\.setItem/);
  assert.match(main, /renderSkinVariables\(activeSkin\(\)\)/);
  assert.match(main, /if \(closeHomePreview\(\)\) return;/);
  for (const id of ['spark','neon-fox','fox','robot','rocket','dragon','shield']) {
    assert.ok(html.includes('data-profile-avatar="' + id + '"'), id);
    assert.ok(css.includes('[data-avatar=' + id + ']'), id);
  }
  for (const id of ['frozen-christmas','golden-dragon','spring-blossom','summer-paradise','autumn-kingdom','halloween-curse','midnight-gold'])
    assert.ok(css.includes(':root[data-skin="' + id + '"]'), id);
});

test('Visual 3 makes collection and store independently reachable and uses a bounded home layout', () => {
 const main = fs.readFileSync(path.resolve(__dirname, '../src/main.js'), 'utf8');
 assert.equal(count('home-skins'),1);
 assert.equal(count('home-skin-store'),1);
 assert.match(html,/id="home-skins"[^>]*data-page="skin-page"[^>]*data-collection="true"/);
 assert.match(html,/id="home-skin-store"[^>]*data-page="skin-page"/);
 assert.ok(html.indexOf('id="home-skin-store"') < html.indexOf('id="menu-page"'));
 assert.match(main,/openSkins\(button\.dataset\.collection === 'true'\)/);
 assert.match(main,/function openSkins\(ownedOnly = false\)/);
 assert.match(main,/collectionOnly = ownedOnly/);
 assert.match(css,/data-home-revision="3"[^\n]*\{\s*padding:[^}]*overflow:hidden/);
 assert.match(css,/data-home-revision="3"[^\n]*\.premium-hero-stage\s*\{\s*flex:1 1 0;min-height:0/);
 assert.ok(html.indexOf('id="skin-equip"') < html.indexOf('id="skin-options"'));
});
test('Gameplay sound button is a real accessible fourth control with a visible mute state', () => {
 assert.equal(count('game-sound-btn'),1);
 assert.equal(count('game-sound-label'),1);
 assert.match(html,/id="game-sound-btn"[^>]*aria-pressed="true"/);
 assert.match(css,/#view-game #controls\s*\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(css,/#game-sound-btn\[aria-pressed="false"\] \.sound-waves/);
});
