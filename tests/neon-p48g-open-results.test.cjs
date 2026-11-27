const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p48g-open-results.css');
test('P4.8g: all Core Neon results have a clear borderless surface, including layered Victory rim',()=>{
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.equal(selectors.length,6);
 assert.ok(selectors.every(l=>l.includes('[data-skin="neon"][data-edition="core"] #overlay.flex:is(')&&['victory','defeat','draw'].every(o=>l.includes('[data-outcome="'+o+'"]'))));
 assert.match(css,/\.glass-panel\.center-panel\s*\{[^}]*background:none!important;[^}]*border-color:transparent!important;[^}]*box-shadow:none!important;[^}]*backdrop-filter:none!important;/);
 assert.match(css,/@layer neonControls\s*\{[\s\S]*\[data-outcome="victory"\] \.glass-panel\.center-panel\s*\{[^}]*border-color:transparent!important;box-shadow:none!important;/);
 assert.ok(read('src/main.js').includes("import './neon-p48f-results-glass.css';\nimport './neon-p48g-open-results.css';"));
});
test('P4.8g: leave emblem artwork, result captions, motion and control geometry intact',()=>{
 assert.match(css,/#result-title::before\s*\{[^}]*background-color:transparent!important;[^}]*box-shadow:none!important;/);
 assert.doesNotMatch(css,/#result-title::before\s*\{[^}]*\bbackground\s*:/);
 assert.match(css,/\.rm-outcome-emblem\s*\{[^}]*background:none!important;[^}]*border-color:transparent!important;/);
 assert.doesNotMatch(css,/\b(?:padding|margin|gap|width|height|display|position|transform|opacity|animation|filter|content)\s*:|url\(|::after/);
});
