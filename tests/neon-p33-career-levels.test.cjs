const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'../src',name),'utf8');
const main=read('main.js'),html=read('index.html'),css=read('neon-p33-career-levels.css');
test('P3.3 new chapter presentation is scoped to visible Core Neon Levels',()=>{
 assert.match(main,/import '\.\/neon-p32-career-nav\.css';\s*import '\.\/neon-p33-career-levels\.css';/);
 assert.match(css,/#career-chapter-hero,#career-levels-heading,#career-level-play \{display:none;\}/);
 assert.match(css,/repeat\(5,minmax\(0,1fr\)\)/);
 for(const line of css.split('\n').filter(l=>l.trimStart().startsWith(':root'))){
  assert.ok(line.includes('[data-skin="neon"][data-edition="core"]'));
  assert.ok(line.includes('#career-levels-pane:not([hidden])'));
 }
 assert.doesNotMatch(css,/#home-hub|#quick-settings/);
});
test('P3.3 chapter hero and stars use existing profile data',()=>{
 for(const id of ['career-chapter-portrait','career-chapter-number','career-chapter-rival','career-chapter-name','career-chapter-progress','career-chapter-count','career-level-play'])assert.ok(html.includes('id="'+id+'"'));
 assert.match(main,/chapterPortrait\.dataset\.rival=world\.rival\.toLowerCase\(\)/);
 assert.match(main,/Array\.from\(\{length:5\},\(_,i\)=>first\+i\)\.filter\(level=>Boolean\(profile\.stars\[level\]\)\)\.length/);
 assert.match(main,/button\.dataset\.earnedStars=String\(earned\)/);
 assert.match(main,/button\.disabled = level > profile\.unlockedLevel/);
});
test('P3.3 both Play controls reuse the guarded launch and actual confirmation source',()=>{
 assert.match(main,/function startSelectedCareer\(sourceButton\)/);
 assert.match(main,/level > campaignLimit \|\| level > state\.profile\.unlockedLevel/);
 assert.match(main,/startCareer, sourceButton\)/);
 assert.match(main,/el\('career-start-btn'\)\.onclick=\(\)=>startSelectedCareer\(el\('career-start-btn'\)\)/);
 assert.match(main,/bindPage\('career-level-play',\(\)=>startSelectedCareer\(el\('career-level-play'\)\)\)/);
});
test('P3.3 explicit row order and narrow viewport fallback preserve reachable CTA',()=>{
 for(const [id,row] of [['#career-chapter-hero',2],['#career-levels-heading',3],['#chapter-route',4],['.rm-career-progress',5],['#career-level-play',6]])assert.ok(css.includes('> '+id+' {grid-row:'+row+';}'));
 assert.match(css,/@media\(max-width:300px\)/);
 assert.match(css,/repeat\(3,minmax\(44px,1fr\)\)/);
});