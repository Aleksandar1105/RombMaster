const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const css=read('src/neon-p1-home.css');

test('P1.1 imports after legacy Neon sheets and affects only visible Android Core Home',()=>{
  const main=read('src/main.js');
  assert.match(main,/import '\.\/neon-screens\.css';\s*import '\.\/neon-p1-home\.css';/);
  assert.match(css,/:root\[data-skin="neon"\]\[data-edition="core"\]/);
  assert.match(css,/#home-hub\[data-neon-reference="1"\]:not\(\[hidden\]\)/);
  assert.doesNotMatch(css,/#(?:quick-settings|career-page|view-game|menu-page|overlay|confirm-dialog)/);
});

test('P1.1 Play is the only idle pulsing control, with existing button material',()=>{
  assert.match(css,/#startBtn:not\(:disabled\)\s*\{[\s\S]*?--neon-action-rim:linear-gradient/);
  assert.match(css,/--neon-action-face:radial-gradient/);
  assert.match(css,/animation:rm-home-play-beacon 3\.8s/);
  assert.equal((css.match(/animation:rm-home-play-beacon/g)||[]).length,1);
  assert.doesNotMatch(css,/grid-template-columns|grid-template-rows|grid-area|position:fixed|width:\s*\d|height:\s*\d/);
});

test('P1.1 responsive tap and logo reveal retain Android Back and accessibility',()=>{
  assert.match(css,/> button:active:not\(:disabled\)/);
  assert.match(css,/transform:scale\(\.968\)/);
  assert.match(css,/animation-play-state:paused/);
  for(const name of ['rm-home-logo-rim','rm-home-logo-symbols','rm-home-logo-wordmark']) {
    assert.match(css,new RegExp('@keyframes '+name));
  }
  assert.match(css,/@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css,/animation:none !important/);
  const html=read('src/index.html');
  assert.match(html,/<button id="continueBtn"/);
  assert.match(html,/<button id="startBtn"/);
  assert.match(html,/<button id="daily-open-btn"/);
});
