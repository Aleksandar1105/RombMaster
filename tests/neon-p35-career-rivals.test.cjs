const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'../src',name),'utf8');
const main=read('main.js'),html=read('index.html'),css=read('neon-p35-career-rivals.css');
test('P3.5 preserves six original rival portraits and Core Career-only layout',()=>{
 assert.match(main,/import '\.\/neon-p35-career-rivals\.css';/);
 for(const [i,name] of ['rookie','trickster','predator','phantom','grandmaster','omega'].entries()){
  assert.ok(html.includes('id="career-rival-card-'+i+'"'));
  assert.ok(html.includes('/assets/premium/master/rival-'+name+'-master.webp'));
 }
 assert.equal((html.match(/class="rm-rival-chapter-progress"/g)||[]).length,6);
 assert.doesNotMatch(css,/#home-hub|#quick-settings/);
 assert.match(css,/#career-rivals-pane:not\(\[hidden\]\)/);
});
test('P3.5 Core current rival and chapter indicators follow five-level intervals',()=>{
 assert.match(main,/const start = coreEdition \? i \* 5 \+ 1 : world\.start/);
 assert.match(main,/const end = coreEdition \? Math\.min\(\(i \+ 1\) \* 5, campaignLimit\) : world\.end/);
 assert.match(main,/String\(home \|\| coreEdition \? current :/);
 assert.match(main,/\.filter\(level=>Boolean\(profile\?\.stars\?\.\[level\]\)\)\.length/);
 assert.match(main,/indicator\.textContent = coreEdition \? '★'\.repeat\(completed\)\+'☆'\.repeat\(total-completed\)/);
});
test('P3.5 rival states retain locked, completed and current distinctions',()=>{
 assert.match(css,/\[data-state="locked"\] img/);
 assert.match(css,/\[data-state="defeated"\] small/);
 assert.match(css,/\[data-current="true"\]/);
 assert.match(main,/if \(status && prefix === 'career-rival-card' && coreEdition\)/);
 assert.match(css,/@media\(orientation:landscape\)/);
});