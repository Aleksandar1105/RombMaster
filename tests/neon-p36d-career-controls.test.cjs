const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'../src',name),'utf8');
const css=read('neon-p36d-career-controls.css');
test('P3.6d control materials load after surfaces and are Career-only',()=>{
 assert.ok(read('main.js').includes("import './neon-p36c-career-surfaces.css';\nimport './neon-p36d-career-controls.css';"));
 const selectors=css.split('\n').filter(l=>l.startsWith(':root'));
 assert.ok(selectors.length>0);
 for(const s of selectors)assert.ok(s.includes('[data-skin="neon"][data-edition="core"]')&&s.includes('#menu-page:not([hidden]):has(#career-page:not([hidden]))'),s);
 assert.doesNotMatch(css,/#home-hub|#quick-settings|#view-game|@keyframes|animation:|transition:|url\(/);
});
test('P3.6d controls preserve selected, cleared, locked and keyboard focus states',()=>{
 for(const token of ['[aria-pressed="true"]:not(:disabled)','[data-level-state="cleared"]','[data-level-state="locked"]','[data-state="locked"]',':not(:disabled):focus-visible',':disabled','#career-level-play:not(:disabled)','#career-start-btn:not(:disabled)'])assert.ok(css.includes(token));
});
