const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p310-career-final.css');
test('P3.10: final sheet is isolated to visible Core Neon Career',()=>{
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.ok(selectors.length>50);
 assert.ok(selectors.every(l=>l.includes('[data-skin="neon"][data-edition="core"]')&&l.includes('#career-page:not([hidden])')));
 assert.ok(!css.includes('#quick-settings')&&!css.includes('#home-hub'));
 assert.ok(read('src/main.js').includes("import './neon-p310-career-final.css';"));
});
test('P3.10: header and faceted glass reuse approved Quick Play materials',()=>{
 const quick=read('src/neon-p26e-quick-fit.css');
 const material=read('src/neon-p23-quick-glass.css');
 const finish=read('src/neon-p26-quick-polish.css');
 const line='linear-gradient(90deg,transparent,#49dcff 27%,#d27aff 62%,#ff5c78 82%,transparent)';
 const facet='linear-gradient(142deg,var(--qp-glass-facet) 0 9%,transparent 9% 79%,var(--qp-glass-facet) 79% 88%,transparent 88%)';
 assert.ok(css.includes(line)&&quick.includes(line));
 assert.ok(css.includes(facet)&&material.includes(facet));
 assert.ok(css.includes('#ffd5cc,#ff4966 30%,#b61938 65%,#ff5d70')&&finish.includes('#ffd5cc,#ff4966 30%,#b61938 65%,#ff5d70'));
 assert.ok(css.includes('inset:0 0 6px!important'));
 assert.ok(css.includes(':focus-visible')&&css.includes(':disabled'));
});
test('P3.10: portrait layout retains real five missions and six rivals with natural overflow',()=>{
 const html=read('src/index.html');
 assert.equal((html.match(/data-mission-slot="[0-4]"/g)||[]).length,5);
 assert.equal((html.match(/id="career-rival-card-[0-5]"/g)||[]).length,6);
 assert.ok(css.includes('repeat(5,minmax(min-content,1fr))'));
 assert.ok(css.includes('repeat(6,minmax(min-content,1fr))'));
 assert.ok(css.includes('overflow-y:auto!important'));
 assert.ok(!css.includes('overflow-y:hidden'));
 assert.ok(css.includes('minmax(min-content,1fr)'));
});
test('P3.10: motion is finite, portrait integration and state icons are local',()=>{
 assert.ok(css.includes('rm-career-p310-sweep 3.2s ease-in-out 2'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(css.includes('mask-image:radial-gradient'));
 assert.ok(css.includes('data:image/svg+xml'));
 assert.ok(!/\binfinite\b/.test(css));
});
