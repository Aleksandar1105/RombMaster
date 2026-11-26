const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'../src',name),'utf8');
const html=read('index.html'),main=read('main.js'),css=read('neon-p32-career-nav.css');
test('P3.2 direct Career navigation maps each control to its one real pane',()=>{
 for(const name of ['levels','mission','rivals']){
  assert.equal((html.match(new RegExp('data-career-tab="'+name+'"','g'))||[]).length,1);
  assert.match(html,new RegExp('aria-controls="career-'+name+'-pane"'));
  assert.match(html,new RegExp('id="career-'+name+'-pane" data-career-screen="'+name+'"'));
 }
 assert.match(main,/tab\.dataset\.careerTab===careerScreens\[careerScreen\]/);
});
test('P3.2 uses existing Career controller, identity guard and Back path',()=>{
 assert.match(main,/careerScreens\.indexOf\(tab\.dataset\.careerTab\)/);
 assert.match(main,/if\(index<0\|\|!el\('career-identity'\)\.hidden\|\|el\('career-page'\)\.hidden\|\|el\('menu-page'\)\.hidden\)return;/);
 assert.match(main,/setCareerScreen\(index\)/);
 assert.match(main,/careerScreen>0\)\{setCareerScreen\(careerScreen-1\);return true;/);
 assert.match(main,/el\('career-screen-nav'\)\.hidden=identityOpen/);
});
test('P3.2 glass tabs are Core Neon Career scoped, with legacy fallback',()=>{
 assert.match(main,/import '\.\/neon-p32-career-nav\.css';/);
 assert.match(css,/#career-direct-nav \{display:none;\}/);
 assert.match(css,/repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/button\[data-career-tab\]\[aria-pressed="true"\]/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 for(const line of css.split('\n').filter(l=>l.trimStart().startsWith(':root'))){
  assert.ok(line.includes('[data-skin="neon"][data-edition="core"]'));
  assert.ok(line.includes('#career-page:not([hidden])'));
 }
 assert.doesNotMatch(css,/#home-hub|#quick-settings/);
});