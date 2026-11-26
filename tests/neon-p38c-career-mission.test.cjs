const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p38c-career-mission.css');
test('P3.8c: isolated visible Core Neon Mission polish with portrait fit fallback',()=>{
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.ok(selectors.length>=20);
 assert.ok(selectors.every(l=>l.includes('[data-skin="neon"][data-edition="core"]')&&l.includes('#career-mission-pane:not([hidden])')));
 assert.ok(css.includes('(orientation:portrait) and (min-width:351px) and (min-height:721px)'));
 assert.ok(css.includes('min-height:clamp(72px,10dvh,94px)'));
 assert.ok(!/overflow\s*:|position\s*:\s*fixed|pointer-events\s*:|animation\s*:/.test(css));
 assert.ok(read('src/main.js').includes("import './neon-p38c-career-mission.css';"));
});
test('P3.8c: completed, selected, locked and focus styling uses existing mission states',()=>{
 assert.ok(css.includes('[data-state="cleared"]:not([aria-pressed="true"]):not(:disabled)'));
 assert.ok(css.includes('[aria-pressed="true"]:not(:disabled) .rm-mission-icon'));
 assert.ok(css.includes(':disabled .rm-mission-xp'));
 assert.ok(css.includes(':focus-visible'));
 assert.ok(css.includes('[data-complete="true"]'));
 assert.ok(!/content\s*:|display\s*:/.test(css));
 const html=read('src/index.html');
 assert.equal((html.match(/data-mission-slot="[0-4]"/g)||[]).length,5);
 assert.ok(html.includes('data-mission-xp')&&html.includes('data-mission-state')&&html.includes('id="career-start-btn"'));
});
