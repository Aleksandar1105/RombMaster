const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p38b-career-levels.css');
test('P3.8b: only visible Core Neon Levels; tall portrait expansion and scroll fallback',()=>{
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.ok(selectors.length>=10);
 assert.ok(selectors.every(l=>l.includes('[data-skin="neon"][data-edition="core"]')&&l.includes('#career-levels-pane:not([hidden])')));
 assert.ok(css.includes('(orientation:portrait) and (min-width:351px) and (min-height:721px)'));
 assert.ok(css.includes('(max-height:720px)'));
 assert.ok(!/overflow\s*:|position\s*:\s*fixed/.test(css));
 assert.ok(read('src/main.js').includes("import './neon-p38b-career-levels.css';"));
});
test('P3.8b: larger portrait and level targets preserve existing controls and state colors',()=>{
 assert.ok(css.includes('max-width:clamp(132px,43vw,184px)'));
 assert.ok(css.includes('minmax(min-content,1fr)'));
 assert.ok(css.includes('min-height:clamp(90px,14dvh,124px)'));
 assert.ok(css.includes('min-height:clamp(56px,7.5dvh,68px)'));
 assert.ok(!/--rim:|--face:|pointer-events:/.test(css));
 assert.ok(read('src/index.html').includes('id="career-level-play"'));
});
