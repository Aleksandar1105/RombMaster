const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const css=read('src/neon-screens.css').split('/* P1.12a —')[1];
test('P1.12a full-width portrait HUD has explicit independent identity, career and reward columns',()=>{
 assert.ok(css);
 assert.match(css,/display:contents !important/);
 assert.match(css,/width:100% !important;max-width:none !important;justify-self:stretch !important/);
 for(const [id,col,row] of [['#premium-player-avatar','1','1/4'],['#premium-player-name','2','1'],['#premium-world-level','2','2'],['.home-coin-count','2','3'],['#premium-player-xp','3','1'],['#premium-career-progress','3','3'],['#premium-player-stars','4','1'],['#premium-brain-points','4','2/4'],['.home-settings-trigger','5','1/4']]){
  assert.ok(css.split(id+' {').slice(1).some(b=>b.split('}')[0].includes('grid-column:'+col+' !important')&&b.split('}')[0].includes('grid-row:'+row+' !important')),id);
 }
 assert.match(css,/@media\(max-width:370px\)/);
 assert.doesNotMatch(css,/#career-page|#view-game|#menu-page/);
});
test('P1.12a keeps actual values and the existing bottom Help control',()=>{
 const html=read('src/index.html');
 assert.match(html,/id="premium-career-progress" aria-label="Career progress"/);
 assert.match(html,/class="home-help-footer"><button id="helpBtn"/);
 assert.equal((html.match(/id="premium-career-progress"/g)||[]).length,1);
 assert.equal((html.match(/id="premium-player-coins"/g)||[]).length,1);
 assert.equal((html.match(/id="helpBtn"/g)||[]).length,1);
});
