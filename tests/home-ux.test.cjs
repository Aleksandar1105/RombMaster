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
  assert.ok(css.includes(':root[data-skin]:not([data-skin="neon"]) .premium-home-progress'));
});
