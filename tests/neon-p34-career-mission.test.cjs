const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'../src',name),'utf8');
const main=read('main.js'),html=read('index.html'),css=read('neon-p34-career-mission.css');
test('P3.4 approved five mission cards replace visible board only in Core Neon Mission',()=>{
 assert.match(main,/import '\.\/neon-p34-career-mission\.css';/);
 assert.equal((html.match(/data-mission-slot="[0-4]"/g)||[]).length,5);
 assert.match(css,/#career-mission-list \{display:none;\}/);
 assert.match(css,/:is\(\.rm-mission-header,#mission-preview,#career-description\) \{display:none!important;\}/);
 assert.match(html,/id="mission-preview"/);
 assert.doesNotMatch(css,/#home-hub|#quick-settings/);
});
test('P3.4 mission titles, completion and XP reflect existing profile data',()=>{
 assert.match(main,/const mission=missionFor\(level\)/);
 assert.match(main,/const earned=profile\.stars\[level\]\|\|0/);
 assert.match(main,/\(3-earned\)\*50\+\(earned===0\?50:0\)/);
 assert.match(main,/card\.querySelector\('progress'\)\.value=earned/);
 assert.match(main,/chapterCleared\+' \/ 5 levels completed'/);
 assert.match(main,/dataset\.complete=String\(chapterCleared===5\)/);
});
test('P3.4 locked cards cannot select unavailable missions and launch remains guarded',()=>{
 assert.match(main,/card\.disabled=locked/);
 assert.match(main,/level>current\.unlockedLevel\|\|level>campaignLimit/);
 assert.match(main,/el\('career-mission-pane'\)\.hidden/);
 assert.match(main,/el\('career-start-btn'\)\.onclick=\(\)=>startSelectedCareer/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});