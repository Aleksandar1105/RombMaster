const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'../src',name),'utf8');
const css=read('neon-p36e-career-motion.css');
test('P3.6e motion is scoped to visible active Core Neon Career',()=>{
 assert.ok(read('main.js').includes("import './neon-p36d-career-controls.css';\nimport './neon-p36e-career-motion.css';"));
 const selectors=css.split('\n').filter(l=>l.startsWith(':root'));
 assert.ok(selectors.length>0);
 for(const s of selectors)assert.ok(s.includes('[data-skin="neon"][data-edition="core"] #view-menu.active-view')&&s.includes('#menu-page:not([hidden]):has(#career-page:not([hidden]))'),s);
 assert.doesNotMatch(css,/#home-hub|#quick-settings|#view-game|url\(/);
});
test('P3.6e effects are finite, nonblocking and exclude disabled controls',()=>{
 for(const token of ['180ms ease-out both','100ms ease-out',':not(:disabled):active',':not([data-state="locked"]) img','pointer-events:none!important','2.7s ease-in-out 2','1.8s ease-in-out 2'])assert.ok(css.includes(token),token);
 assert.doesNotMatch(css,/\binfinite\b/);
});
test('P3.6e respects reduced motion',()=>{
 assert.ok(css.includes('prefers-reduced-motion:no-preference'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(css.includes('animation:none!important;transition:none!important'));
});
