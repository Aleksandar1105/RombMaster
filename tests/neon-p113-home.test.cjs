const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const css=read('src/neon-p113-home.css');
test('P1.13 uses the existing live HUD fields in two open bands and a progress row',()=>{
 assert.match(read('src/main.js'),/import '\.\/neon-p1-press\.css';\s*import '\.\/neon-p113-home\.css';/);
 assert.match(css,/grid-template-columns:repeat\(8,minmax\(0,1fr\)\) 44px/);
 assert.match(css,/border:0 !important;border-radius:0 !important/);
 assert.match(css,/#premium-player-name \{\s*grid-column:3\/6 !important;grid-row:1/);
 assert.match(css,/#premium-world-level \{\s*grid-column:6\/9 !important;grid-row:1/);
 assert.match(css,/#premium-career-progress \{\s*grid-column:5\/10 !important;grid-row:3/);
 assert.match(css,/width:44px !important;height:44px !important/);
 assert.doesNotMatch(css,/#view-game|#menu-page|#premium-hero-stage/);
});
test('P1.13 uses opacity-only entrance and removes continuous idle filter animations without disabling press feedback',()=>{
 assert.match(read('src/neon-p1-home.css'),/@keyframes rm-intro-ui \{from \{opacity:0;\}to \{opacity:1;\}\}/);
 assert.match(css,/animation-duration:\.45s !important;animation-timing-function:linear !important/);
 assert.match(css,/will-change:opacity/);
 assert.match(css,/rm-intro-backdrop \.42s ease-out 2\.18s both/);
 assert.match(css,/@layer neonControls \{[\s\S]*?filter:none !important/);
 assert.match(css,/#startBtn:not\(:disabled\):not\(\.rm-home-press\)/);
 assert.match(read('src/neon-p1-press.css'),/rm-home-press-sweep/);
 assert.match(css,/@media \(prefers-reduced-motion:reduce\)/);
});
