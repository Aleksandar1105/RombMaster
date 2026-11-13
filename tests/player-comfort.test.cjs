const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.resolve(__dirname, '../src/index.html'), 'utf8');
const main = fs.readFileSync(path.resolve(__dirname, '../src/main.js'), 'utf8');
const game = fs.readFileSync(path.resolve(__dirname, '../src/game.js'), 'utf8');
const native = fs.readFileSync(path.resolve(__dirname, '../src/native.js'), 'utf8');
const preflight = fs.readFileSync(path.resolve(__dirname, '../scripts/qa-local.ps1'), 'utf8');

test('comfort preferences have accessible controls and preserve offline play', () => {
  for (const id of ['comfort-settings','sound-toggle','haptics-toggle','comfort-status']) {
    assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
  }
  assert.match(html,/aria-label="Enable game sounds"/);
  assert.match(html,/aria-label="Enable vibration feedback"/);
  assert.match(main,/rombmaster\.comfort\.v1/);
  assert.match(main,/setComfort\(readComfort\(\)\)/);
  assert.match(game,/setSoundEnabled\(enabled\)/);
  assert.match(native,/setHapticsEnabled\(enabled\)/);
  assert.match(native,/if \(!this\.hapticsEnabled\) return/);
});

test('local QA only runs on the Career chapter branch', () => {
  assert.match(preflight,/\$expectedBranch = "feat\/career-opening-chapter"/);
  assert.match(preflight,/npm-ci/);
  assert.match(preflight,/node-tests/);
  assert.match(preflight,/vite-web-build/);
  assert.match(preflight,/gradle-assemble-debug/);
  assert.match(preflight,/-InstallDebug/);
});
