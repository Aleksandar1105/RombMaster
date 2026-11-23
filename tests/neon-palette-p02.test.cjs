const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('Neon P0.2 has centrally defined cyan/red/navy/white palette',()=>{
 const css=read('src/skin-store-compact.css');
 assert.match(css,/--neon-cyan:#2de6f4;/);
 assert.match(css,/--neon-red:#ff5965;/);
 assert.match(css,/--neon-navy:#0a1c30;/);
 assert.match(css,/--neon-text:#f3faff;/);
 assert.match(css,/--neon-action-rim:linear-gradient\([^;]*var\(--home-jewel\)[^;]*\)/);
});

test('Neon Home keeps a cyan row and red primary Play without changing button geometry',()=>{
 const css=read('src/skin-store-compact.css');
 assert.match(css,/\.play-row button\{--home-jewel:var\(--neon-cyan\)!important;\}/);
 assert.match(css,/\.play-row #startBtn\{--home-jewel:var\(--neon-red\)!important;\}/);
 assert.match(css,/\.mode-grid button:last-child\{--home-jewel:var\(--neon-red\)!important;\}/);
 assert.match(css,/--neon-action-shape:polygon\(var\(--home-cut\) 0,/);
 const game=read('src/game.js');
 assert.match(game,/button\.disabled = !canResume/);
});

test('Neon P0.2 Quick Play and selected controls no longer use the hot-pink accents',()=>{
 const css=read('src/neon-screens.css');
 const compact=read('src/skin-store-compact.css');
 assert.match(css,/#setup-play \{ --home-jewel: var\(--neon-red\); \}/);
 assert.match(css,/--rim:linear-gradient\(112deg,[^;]*var\(--neon-red\)[^;]*\) !important;/);
 assert.doesNotMatch(css,/#(?:f35aaf|ef65bd|e66be9|f377c0|ff83ce|ff7fa5|f56d91|c83d78)/i);
 assert.doesNotMatch(compact,/#(?:f35aaf|ef65bd|e66be9|f377c0|ff83ce)/i);
});
