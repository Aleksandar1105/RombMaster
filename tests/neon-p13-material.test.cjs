const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p1-material.css');

test('P1.3 is imported last and scoped to only Android Core Neon Home',()=>{
 const js=read('src/main.js');
 assert.match(js,/import '\.\/neon-p1-transitions\.css';\s*import '\.\/neon-p1-material\.css';/);
 assert.match(css,/@layer neonControls\s*\{/);
 assert.match(css,/:root\[data-skin="neon"\]\[data-edition="core"\]/);
 assert.match(css,/#home-hub\[data-home-revision="3"\]\[data-layout="premium"\]\[data-neon-reference="1"\]:not\(\[hidden\]\)/);
 assert.doesNotMatch(css,/#(?:menu-page|view-game|quick-settings|career-page|overlay|confirm-dialog)/);
});

test('P1.3 overrides actual --rim and --face from the same cascade layer',()=>{
 const old=read('src/neon-screens.css');
 assert.match(old,/background:var\(--rim\) !important/);
 assert.match(old,/background:radial-gradient\([^;]*var\(--face\) !important/);
 assert.match(css,/--rim:radial-gradient\(ellipse/);
 assert.match(css,/--face:linear-gradient\(152deg/);
 assert.match(css,/background:var\(--rim\) !important/);
 assert.match(css,/var\(--face\) !important/);
 assert.match(css,/\.play-row #startBtn:not\(:disabled\)/);
 assert.match(css,/var\(--neon-cyan,#2de6f4\)/);
});

test('P1.3 is paint-only, keeps Continue and Android Back behavior',()=>{
 assert.doesNotMatch(css,/grid-template|grid-column|grid-row|position:fixed|width\s*:|height\s*:/);
 const neon=read('src/neon-screens.css'),game=read('src/game.js'),js=read('src/main.js');
 assert.match(neon,/#continueBtn:disabled/);
 assert.match(game,/button\.disabled = !canResume/);
 assert.match(js,/Native\.onBack\(\(\) =>/);
});

test('P1.3 retains one Play pulse and leaves logo motion to P1.7',()=>{
 const base=read('src/neon-p1-home.css');
 assert.match(base,/animation:rm-home-play-beacon 3\.8s/);
 assert.match(css,/@keyframes rm-home-play-beacon/);
 assert.match(css,/drop-shadow\(0 0 15px #2de6f4b3\)/);
 assert.doesNotMatch(css,/animation:rm-p13-wordmark/);
 assert.match(base,/animation:rm-home-logo-wordmark/);
 assert.match(css,/@media \(prefers-reduced-motion:reduce\)/);
 assert.match(css,/animation:none !important/);
});