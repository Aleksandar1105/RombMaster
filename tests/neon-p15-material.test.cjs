const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p1-material.css');

test('P1.5 uses existing Neon material without new overlay, size or layout rules',()=>{
 const js=read('src/main.js');
 assert.match(js,/import '\.\/neon-p1-material\.css';/);
 assert.match(css,/@layer neonControls\s*\{/);
 assert.match(css,/:root\[data-skin="neon"\]\[data-edition="core"\]/);
 assert.match(css,/#home-hub\[data-home-revision="3"\]\[data-layout="premium"\]\[data-neon-reference="1"\]:not\(\[hidden\]\)/);
 assert.match(css,/:is\(\.play-row,\.mode-grid\) > button:not\(\[hidden\]\)/);
 assert.doesNotMatch(css,/grid-template|grid-column|grid-row|position:fixed|(?:^|\s)(?:width|height|font-size)\s*:/);
 assert.doesNotMatch(css,/#(?:quick-settings|menu-page|view-game|overlay|career-page)/);
});
test('Play is brighter than navy secondary actions and violet has priority (P1.12c)',()=>{
 assert.match(css,/secondary surfaces keep their dark navy depth/);
 assert.match(css,/--face:linear-gradient\(152deg,#193448/);
 assert.match(css,/\.play-row #startBtn:not\(:disabled\)/);
 assert.match(css,/--face:linear-gradient\(155deg,#7442a1/);
 assert.match(css,/radial-gradient\(ellipse 47% 100% at 9% 0%,#fff4ff/);
 assert.match(css,/radial-gradient\(ellipse 43% 100% at 92% 0%,#f9dcff/);
 assert.match(css,/filter:drop-shadow\(0 0 6px #e77affb0\)/);
 assert.match(css,/@keyframes rm-home-play-beacon/);
 assert.match(css,/drop-shadow\(0 0 15px #e77affb3\)/);
});
test('P1.5 preserves Continue and motion preferences; touch ripple remains P1.6',()=>{
 assert.match(read('src/game.js'),/button\.hidden = !stableNeonHome && !canResume/);
 assert.match(read('src/game.js'),/button\.disabled = !canResume/);
 assert.match(read('src/neon-screens.css'),/#continueBtn:disabled/);
 assert.match(css,/@media \(prefers-reduced-motion:reduce\)/);
 assert.match(css,/animation:none !important/);
 assert.doesNotMatch(css,/touchstart|pointerdown|requestAnimationFrame/);
});