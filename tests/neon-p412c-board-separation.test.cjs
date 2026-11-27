const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p412c-board-separation.css');
test('P4.12c: optical separation only behind the active Core Neon board',()=>{
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.equal(selectors.length,2);
 const scope=':root[data-skin="neon"][data-edition="core"] #view-game.active-view #canvas-wrapper';
 assert.equal(selectors[0],scope+' {');
 assert.equal(selectors[1],scope+'::before {');
 assert.match(css,/isolation:isolate/);
 assert.match(css,/z-index:-1/);
 assert.match(css,/pointer-events:none/);
 assert.match(css,/radial-gradient\(ellipse farthest-side at 50% 50%,#030a16e6 0%,#030a16bf 82%,#030a1680 90%,transparent 100%\)/);
 assert.ok(read('src/main.js').includes("import './neon-p412b-gameplay-header.css';\nimport './neon-p412c-board-separation.css';"));
});
test('P4.12c: no board geometry, input or other screen styles',()=>{
 assert.doesNotMatch(css,/\b(?:width|height|padding|margin|border|transform|filter|backdrop-filter|animation|transition|touch-action|overflow|clip-path)\s*:/);
 assert.doesNotMatch(css,/#overlay|#view-menu|#controls|#scoreboard|#turn-status|#match-mode|url\(/);
 assert.match(css,/inset:-8% -8%/);
});
