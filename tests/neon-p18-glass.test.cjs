const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const css=read('src/neon-p1-material.css');

test('P1.8 glass has real facets, beveled highlights and a readable dark face',()=>{
 assert.match(css,/--glass-facet:#bff9ff55/);
 assert.match(css,/linear-gradient\(142deg,var\(--glass-facet\)/);
 assert.match(css,/inset 0 1\.5px 0 var\(--glass-edge\),inset 0 -1\.5px 0 var\(--glass-edge\)/);
 assert.match(css,/--face:linear-gradient\(152deg,#193448/);
 assert.match(css,/--glass-light:#e77aff/);
 assert.match(css,/\.mode-grid > button:is\(\[data-page="career-page"\],#home-skin-store\)/);
});

test('P1.8 exterior glow is applied outside clipped buttons without modifying geometry',()=>{
 assert.match(css,/:is\(\.play-row,\.mode-grid\) \{\s*filter:drop-shadow\(0 2px 2px #020713b8\) drop-shadow\(0 0 4px #59dfff66\)/);
 assert.doesNotMatch(css,/grid-template|grid-column|grid-row|position:fixed|(?:^|\s)(?:width|height|font-size)\s*:/);
 assert.doesNotMatch(css,/::after/);
 assert.match(read('src/neon-p1-press.css'),/rm-home-press-sweep/);
 assert.match(read('src/neon-screens.css'),/#continueBtn:disabled/);
 assert.match(read('src/game.js'),/button\.disabled = !canResume/);
});
