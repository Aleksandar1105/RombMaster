const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname,'../src',name),'utf8');
const css = read('neon-p22-quick-layout.css');
test('P2.2 layout is isolated to visible Core Neon Quick Play and does not target Home',()=>{
  const selectors=css.split('\n').filter(line=>line.trimStart().startsWith(':root'));
  assert.ok(selectors.length>20);
  for(const selector of selectors){
    assert.ok(selector.includes('[data-skin="neon"][data-edition="core"]'));
    assert.ok(selector.includes('#menu-page:not([hidden]) #quick-settings:not([hidden])'));
  }
  assert.doesNotMatch(css,/#home-hub|#premium-home-progress|#premium-hero-stage/);
  assert.match(read('main.js'),/import '\.\/neon-p22-quick-layout\.css';/);
});
test('P2.2 retains visible Back and launch controls, compact and landscape layouts, and hidden PvP difficulty',()=>{
  assert.match(css,/#difficulty-wrapper\[hidden\] \{display:none !important;\}/);
  assert.match(css,/repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css,/repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css,/@media \(orientation:landscape\)/);
  assert.match(css,/max-height:720px/);
  assert.match(css,/overflow-y:auto !important/);
  assert.match(css,/#page-back \{[\s\S]*?min-height:44px !important/);
  assert.match(css,/#setup-play \{[\s\S]*?min-height:54px !important/);
});
