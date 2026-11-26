const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'../src',name),'utf8');
const css=read('neon-p36c-career-surfaces.css');
test('P3.6c Career surfaces load after ambience and remain Core Neon scoped',()=>{
 const main=read('main.js');
 assert.ok(main.includes("import './neon-p36-career-ambience.css';\nimport './neon-p36c-career-surfaces.css';"));
 const selectors=css.replace(/\/\*[\s\S]*?\*\//g,'').split('}').filter(s=>s.trim()).flatMap(s=>s.split('{')[0].trim().split(/,\s*\n/));
 for(const s of selectors)assert.ok(s.startsWith(':root[data-skin="neon"][data-edition="core"] #view-menu #menu-page:not([hidden]):has(#career-page:not([hidden])) #career-page:not([hidden])'),s);
 assert.doesNotMatch(css,/#home-hub|#quick-settings|#view-game|@keyframes|animation:|transition:/);
});
test('P3.6c shares panel and progress materials while retaining rival states',()=>{
 for(const pane of ['levels','mission','rivals'])assert.ok(css.includes('#career-'+pane+'-pane:not([hidden])'));
 for(const token of ['--career-panel-face','--career-panel-line','--career-progress-fill','[data-state="locked"]','[data-state="defeated"]','[data-current="true"]','::-webkit-progress-value','::-moz-progress-bar'])assert.ok(css.includes(token));
 assert.doesNotMatch(css,/https?:\/\/|url\(/);
});
