const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const css=read('src/neon-p113-home.css');
test('P1.13.1 uses four equally spaced live counters, with distinct values and captions',()=>{
 const html=read('src/index.html'),js=read('src/main.js');
 assert.match(js,/import '\.\/neon-p113-home\.css';/);
 assert.match(css,/grid-template-columns:repeat\(12,minmax\(0,1fr\)\)/);
 assert.match(css,/border:0 !important;border-radius:0 !important/);
 assert.match(css,/#premium-player-name \{\s*grid-column:3\/8 !important;grid-row:1/);
 assert.match(css,/#premium-career-progress \{\s*grid-column:7\/13 !important;grid-row:3/);
 assert.match(css,/width:44px !important;height:44px !important/);
 for(const [id,label] of [['premium-player-xp','XP'],['premium-player-stars','Stars'],['premium-brain-points','Brain Points']]){
  assert.ok(html.includes('id="'+id+'"><span class="rm-hud-legacy"></span><span class="rm-hud-number"></span><span class="rm-hud-label">'+label+'</span>'));
 }
 assert.match(html,/<span class="rm-hud-label">Coins<\/span>/);
 assert.match(js,/function setHomeMetric\(id, legacy, number\)/);
 assert.match(js,/node\.querySelector\('\.rm-hud-number'\)\.textContent = number/);
 assert.equal((js.match(/setHomeMetric\('premium-brain-points'/g)||[]).length,3);
 assert.doesNotMatch(css,/#view-game|#menu-page/);
});
test('P1.13.1 uses one curtain rather than per-row fades, retains hero and press feedback',()=>{
 assert.match(css,/animation:none !important;opacity:1 !important;will-change:auto/);
 assert.match(css,/animation:rm-intro-backdrop \.55s ease-out 2\.60s both/);
 assert.match(css,/z-index:5 !important/);
 assert.match(css,/#premium-hero-stage:not\(\[hidden\]\) \{z-index:6 !important/);
 assert.match(css,/@layer neonControls \{[\s\S]*?filter:none !important/);
 assert.match(css,/#startBtn:not\(:disabled\):not\(\.rm-home-press\)/);
 assert.match(read('src/neon-p1-press.css'),/rm-home-press-sweep/);
 assert.match(css,/@media \(prefers-reduced-motion:reduce\)/);
 assert.match(read('src/main.js'),/setTimeout\(finishIntro,3250\)/);
});
