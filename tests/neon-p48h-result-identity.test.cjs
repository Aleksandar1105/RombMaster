const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p48h-result-identity.css');
test('P4.8h: scoped result-only identity and equal stacked portrait controls',()=>{
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.equal(selectors.length,9);
 assert.ok(selectors.every(l=>l.includes('[data-skin="neon"][data-edition="core"] #overlay.flex:is(')&&['victory','defeat','draw'].every(o=>l.includes('[data-outcome="'+o+'"]'))));
 assert.match(css,/@media \(orientation:portrait\)\s*\{[\s\S]*flex-direction:column;align-items:stretch;[\s\S]*flex:none;width:100%;/);
 assert.match(css,/#againBtn:not\(:disabled\)\s*\{[^}]*#dd77fb/);
 assert.match(css,/#backMenuBtn:not\(:disabled\)\s*\{[^}]*#3ae1fa/);
 assert.match(css,/@media \(orientation:landscape\) and \(max-height:779px\)/);
 assert.ok(read('src/main.js').includes("import './neon-p48g-open-results.css';\nimport './neon-p48h-result-identity.css';"));
});
test('P4.8h: local faceted defeat crystal and isolated logo crop',()=>{
 const svg=read('src/skin-art/neon-defeat-emblem.svg');
 assert.match(svg,/<svg[^>]*viewBox="0 0 240 240"/);
 assert.match(svg,/id="fracture"/);
 assert.match(svg,/id="shards"/);
 assert.match(svg,/id="aura"[\s\S]*stop-opacity="0"/);
 assert.doesNotMatch(svg,/<(?:rect|image|script|foreignObject)\b/);
 assert.match(css,/\.arena-brand\s*\{[^}]*aspect-ratio:2.9;[^}]*clip-path:polygon/);
 assert.match(read('src/neon-p48g-open-results.css'),/\.glass-panel\.center-panel\s*\{[^}]*background:none!important/);
});
