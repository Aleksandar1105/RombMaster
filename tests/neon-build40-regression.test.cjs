const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

test('Build 40: Neon paints opaque playable cells in the common renderer', () => {
  const source=read('src/renderer.js');
  assert.match(source, /if \(skin\.id === 'neon'\) \{[\s\S]*?fillStyle = '#071b30';[\s\S]*?if \(board\.active\(r, c\)\)/);
  assert.match(source, /this\.ctx\.clearRect\(0, 0, this\.canvas\.width, this\.canvas\.height\)/);
  assert.match(source, /this\.ctx\.lineWidth = 1;[\s\S]*?createLinearGradient/);
});

test('Build 40: Android leaves native gestures accessible while hiding only status bar', () => {
  const source=read('android/app/src/main/java/com/rombmaster/game/MainActivity.java');
  assert.match(source, /show\(WindowInsetsCompat\.Type\.navigationBars\(\)\)/);
  assert.match(source, /hide\(WindowInsetsCompat\.Type\.statusBars\(\)\)/);
  assert.doesNotMatch(source, /controller\.hide\(WindowInsetsCompat\.Type\.systemBars\(\)\)/);
  assert.match(source, /Type\.navigationBars\(\) \| WindowInsetsCompat\.Type\.ime\(\)/);
});

test('Build 40: the Home emblem uses one exact square lattice with X/O symbols', () => {
  const html=read('src/index.html');
  const css=read('src/neon-screens.css');
  const match=html.match(/<svg class="neon-logo-rebuilt-board"[\s\S]*?<\/svg>/);
  assert.ok(match,'rebuilt board SVG');
  assert.equal((match[0].match(/<rect x="-?\d+" y="-?\d+" width="80" height="80"/g)||[]).length,16);
  assert.match(match[0],/rm-logo-glow-cyan/);
  assert.match(match[0],/rm-logo-glow-coral/);
  assert.match(css,/\.neon-home-brand > img \{[\s\S]*?mask-image/);
});
