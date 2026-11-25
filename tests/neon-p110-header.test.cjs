const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const css=read('src/neon-screens.css').split('/* P1.10 —')[1];

test('P1.10 positions HUD values in explicit non-overlapping cells and keeps settings reachable',()=>{
 assert.ok(css);
 assert.match(css,/grid-template-columns:clamp\(44px,13vw,58px\) minmax\(0,1\.15fr\) minmax\(0,1fr\) 44px/);
 for(const [id,col,row] of [['#premium-player-avatar','1','1/4'],['#premium-player-name','2/4','1'],['#premium-player-xp','2','2'],['#premium-player-stars','3','2'],['.home-coin-count','2','3'],['#premium-brain-points','3/5','3'],['.home-settings-trigger','4','1/3']]){
  // Use all matching blocks; compact overrides must not change the cells.
  const bodies=css.split(id+' {').slice(1).map(s=>s.split('}')[0]);
  assert.ok(bodies.some(b=>b.includes('grid-column:'+col+' !important')&&b.includes('grid-row:'+row+' !important')),id);
 }
 assert.match(css,/width:44px !important;height:44px !important;min-width:44px !important;min-height:44px/);
 assert.match(css,/font-variant-numeric:tabular-nums/);
 assert.match(css,/\.home-gem-count \{display:none !important/);
});
test('P1.10 retains actual existing values, campaign limit, progress and native safe area',()=>{
 const html=read('src/index.html'),js=read('src/main.js');
 for(const id of ['premium-player-name','premium-player-xp','premium-player-stars','premium-player-coins','premium-brain-points','premium-world-level','premium-career-count','premium-career-progress']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 }
 assert.match(js,/walletBalance\(economy\.wallet\)\.toLocaleString\('en-US'\)/);
 assert.match(js,/summary\.clearedLevels \+ ' \/ ' \+ campaignLimit/);
 assert.match(js,/progress\.max = campaignLimit/);
 assert.match(css,/padding-top:max\(7px,env\(safe-area-inset-top\)\)/);
 assert.doesNotMatch(css,/#career-page|#menu-page|#view-game/);
 assert.match(css,/data-edition="core"/);
});
