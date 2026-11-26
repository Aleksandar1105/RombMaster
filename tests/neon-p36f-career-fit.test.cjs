const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'../src',name),'utf8');
const css=read('neon-p36f-career-fit.css');
test('P3.6f final layout is imported and scoped to visible Core Neon Career',()=>{
 assert.ok(read('main.js').includes("import './neon-p36e-career-motion.css';\nimport './neon-p36f-career-fit.css';"));
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.ok(selectors.length>0);
 for(const s of selectors)assert.ok(s.includes('[data-skin="neon"][data-edition="core"]')&&s.includes('#career-page:not([hidden])'),s);
 assert.doesNotMatch(css,/#home-hub|#quick-settings|#view-game/);
});
test('P3.6f preserves scrolling, hidden panes and five-tile placement',()=>{
 for(const token of ['overflow-y:auto!important','[data-career-screen][hidden]','grid-template-areas:none!important','button:last-child {grid-column:auto!important;}'])assert.ok(css.includes(token),token);
});
test('P3.6f provides compact portrait and landscape alternatives',()=>{
 for(const token of ['(max-height:720px)','(max-width:340px)','(orientation:landscape) and (min-width:600px)','repeat(5,minmax(0,1fr))','repeat(2,minmax(0,1fr))'])assert.ok(css.includes(token),token);
});
