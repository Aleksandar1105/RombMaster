const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p38e-career-motion.css');
test('P3.8e: finite active Career motion only, with reduced motion fallback',()=>{
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.ok(selectors.length>=10);
 assert.ok(selectors.every(l=>l.includes('[data-skin="neon"][data-edition="core"]')&&l.includes('#view-menu.active-view')&&l.includes('#career-page:not([hidden])')));
 assert.ok(css.includes('(prefers-reduced-motion:no-preference)'));
 assert.ok(css.includes('(prefers-reduced-motion:reduce)'));
 assert.ok(css.includes('animation:none!important;transition:none!important'));
 assert.ok(!/\binfinite\b|will-change\s*:|transition\s*:\s*all/.test(css));
 assert.ok(read('src/main.js').includes("import './neon-p38e-career-motion.css';"));
});
test('P3.8e: responsive selection and current rival aura do not animate layout or filters',()=>{
 assert.ok(css.includes('rm-career-polish-enter 220ms'));
 assert.ok(css.includes('rm-career-polish-selection 240ms'));
 assert.ok(css.includes('rm-career-polish-aura 2s ease-in-out 2'));
 assert.ok(css.includes('rm-career-play-sweep 2.4s ease-in-out 2'));
 assert.ok(css.includes('[data-current="true"][data-state="available"]::after'));
 assert.ok(css.includes('[data-current="true"][data-state="available"] img {animation:none!important;}'));
 assert.ok(css.includes('pointer-events:none'));
 const frames=css.slice(css.indexOf('@keyframes'),css.indexOf('@media (prefers-reduced-motion:reduce)'));
 assert.ok(!/(?:filter|box-shadow|background|width|height|margin|padding)\s*:/.test(frames));
});
