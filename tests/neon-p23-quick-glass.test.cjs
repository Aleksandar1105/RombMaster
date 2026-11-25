const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname,'../src',name),'utf8');
const css = read('neon-p23-quick-glass.css');
test('P2.3 uses existing control layer and isolates glass to visible Core Neon Quick Play',()=>{
  assert.match(css,/@layer neonControls/);
  for(const line of css.split('\n').filter(l=>l.trimStart().startsWith(':root'))){
    assert.ok(line.includes('[data-skin="neon"][data-edition="core"]'));
    assert.ok(line.includes('#menu-page:not([hidden]):has(#quick-settings:not([hidden]))'));
  }
  assert.doesNotMatch(css,/#home-hub|grid-template|grid-row|min-height|@keyframes|animation:/);
  assert.match(read('main.js'),/import '\.\/neon-p22-quick-layout\.css';\s*import '\.\/neon-p23-quick-glass\.css';/);
});
test('P2.3 selected options and launch use distinct glass with accessible selection and focus',()=>{
  assert.match(css,/button\[aria-pressed="true"\] \{[\s\S]*?--qp-rim-inset:2\.5px/);
  assert.match(css,/#setup-play:not\(:disabled\) \{[\s\S]*?--qp-rim-inset:3px/);
  assert.match(css,/button\[aria-pressed="true"\]::after \{[\s\S]*?pointer-events:none !important/);
  assert.match(css,/button:not\(\[aria-pressed="true"\]\)::after \{content:none/);
  assert.match(css,/:focus-visible \{/);
  assert.match(css,/:disabled \{opacity:\.5/);
});
