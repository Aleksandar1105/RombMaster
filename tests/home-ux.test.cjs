const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.resolve(__dirname, '../src/index.html'), 'utf8');
const css = fs.readFileSync(path.resolve(__dirname, '../src/style.css'), 'utf8');
const mark = fs.readFileSync(path.resolve(__dirname, '../src/brand-mark.svg'), 'utf8');
const count = id => (html.match(new RegExp('id="' + id + '"', 'g')) || []).length;

test('home menu prioritizes play choices and keeps them unique', () => {
  for (const id of ['continueBtn', 'startBtn', 'career-start-btn', 'daily-open-btn', 'helpBtn']) {
    assert.equal(count(id), 1, id);
  }
  assert.ok(html.indexOf('id="startBtn"') < html.indexOf('id="quick-settings"'));
  assert.ok(html.indexOf('id="daily-open-btn"') < html.indexOf('id="player-settings"'));
  assert.ok(html.includes('src="./brand-mark.svg"'));
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

test('home uses touch sized targets, focus outlines and vector branding', () => {
  assert.match(css, /home-play\s*\{[^}]*min-height:\s*56px/);
  assert.match(css, /summary:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(mark, /<svg/);
  assert.match(mark, /viewBox="0 0 512 512"/);
});
