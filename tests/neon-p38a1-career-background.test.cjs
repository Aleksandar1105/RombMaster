const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=n=>fs.readFileSync(path.join(__dirname,'../src',n),'utf8');
const css=read('neon-p38a1-career-background.css');
test('P3.8a.1 exposes existing Career art without changing frozen screens',()=>{
 assert.ok(read('main.js').includes("import './neon-p36f-career-fit.css';\nimport './neon-p38a1-career-background.css';"));
 for(const s of css.split('\n').filter(l=>l.startsWith(':root')))assert.ok(s.includes('[data-skin="neon"][data-edition="core"]')&&s.includes('#career-page:not([hidden])'));
 assert.doesNotMatch(css,/#home-hub|#quick-settings|#view-game/);
 assert.ok(css.includes("url('/assets/premium/master/neon-career-command-v1.webp')"));
});
test('P3.8a.1 removes legacy wrapper blur without fading text',()=>{
 for(const s of ['> .home-shell','background:transparent!important;background-image:none!important','backdrop-filter:none!important;-webkit-backdrop-filter:none!important','--career-panel-face','--career-accent-face'])assert.ok(css.includes(s));
 assert.doesNotMatch(css,/\bopacity\s*:/);
});
