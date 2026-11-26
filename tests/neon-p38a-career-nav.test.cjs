const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p38a-career-nav.css');
test('P3.8a: Career heading is local, scoped and retains accessible text fallback',()=>{
 assert.match(css,/min-width:340px/);
 assert.match(css,/forced-colors:none/);
 assert.ok(css.includes('/assets/premium/master/career-title.svg'));
 assert.match(read('src/public/assets/premium/master/career-title.svg'),/<title>CAREER<\/title>/);
 assert.ok(read('src/main.js').includes("import './neon-p38a-career-nav.css';"));
 assert.ok(read('scripts/verify-theme-assets.mjs').includes("'neon-p38a-career-nav.css'"));
});
test('P3.8a: Career-only equal tabs preserve selected and focus states',()=>{
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.ok(selectors.length>0);
 assert.ok(selectors.every(l=>l.includes('[data-edition="core"]')&&l.includes(':has(#career-page:not([hidden]))')));
 assert.ok(css.includes('repeat(3,minmax(0,1fr))'));
 assert.ok(css.includes('[aria-pressed="true"]:not(:disabled)'));
 assert.ok(css.includes(':focus-visible'));
 assert.ok(css.includes('min-height:46px'));
});
