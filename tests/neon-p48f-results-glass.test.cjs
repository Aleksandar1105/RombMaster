const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p48f-results-glass.css');
test('P4.8f: paint only, visible Core Neon results and no new backdrop blur',()=>{
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.equal(selectors.length,4);
 assert.ok(selectors.every(l=>l.includes('[data-skin="neon"][data-edition="core"] #overlay.flex:is(')&&l.includes('[data-outcome="draw"]')));
 assert.match(css,/\.center-panel\s*\{[^}]*#0814266b[^}]*border-color:#84cde814!important;[^}]*backdrop-filter:none!important/);
 assert.doesNotMatch(css,/\b(?:padding|margin|gap|width|height|display|position|transform|opacity|animation|border|border-radius)\s*:|url\(/);
 const main=read('src/main.js');
 assert.ok(main.includes("import './neon-p48e-final-polish.css';\nimport './neon-p48f-results-glass.css';"));
});
test('P4.8f: defeat and draw analysis reads as one integrated section',()=>{
 assert.match(css,/#match-analysis:not\(\[hidden\]\)\s*\{[^}]*border-color:transparent!important;[^}]*box-shadow:none!important/);
 assert.match(css,/\.rm-analysis-stat\s*\{[^}]*background:none!important;[^}]*border-bottom-color:#91bed429!important/);
 assert.match(css,/\.rm-analysis-stat:last-child\s*\{[^}]*border-bottom-color:transparent!important/);
 assert.ok(read('src/index.html').includes('id="match-analysis"'));
});
