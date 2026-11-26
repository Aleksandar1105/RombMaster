const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p38d-career-rivals.css');
test('P3.8d: isolated visible Core Neon Rivals with larger tall portrait assets and compact fallback',()=>{
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.ok(selectors.length>=20);
 assert.ok(selectors.every(l=>l.includes('[data-skin="neon"][data-edition="core"]')&&l.includes('#career-rivals-pane:not([hidden])')));
 assert.ok(css.includes('(orientation:portrait) and (min-width:351px) and (min-height:721px)'));
 assert.ok(css.includes('clamp(70px,22vw,96px)'));
 assert.ok(css.includes('max-width:96px'));
 assert.ok(!/overflow\s*:|position\s*:\s*fixed|animation\s*:|display\s*:/.test(css));
 assert.ok(read('src/main.js').includes("import './neon-p38d-career-rivals.css';"));
});
test('P3.8d: real rival states and six existing assets remain authoritative',()=>{
 assert.ok(css.includes('[data-current="true"][data-state="available"]'));
 assert.ok(css.includes('[data-state="defeated"] img'));
 assert.ok(css.includes('[data-state="locked"] img'));
 assert.ok(css.includes('saturate(.48) brightness(.72)'));
 assert.ok(css.includes('clip-path:none!important'));
 const html=read('src/index.html');
 assert.equal((html.match(/id="career-rival-card-[0-5]"/g)||[]).length,6);
 assert.equal((html.match(/id="career-rival-card-status-[0-5]"/g)||[]).length,6);
 assert.ok(!/url\(|content\s*:/.test(css));
});
