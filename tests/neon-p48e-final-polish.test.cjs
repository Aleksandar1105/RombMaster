const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p48e-final-polish.css');
test('P4.8e: Core Neon live turn text reserves stable rows without clipping or moving canvas',()=>{
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.ok(selectors.every(l=>l.includes('[data-skin="neon"][data-edition="core"]')&&(l.includes('#view-game.active-view')||l.includes('#overlay.flex:is('))));
 assert.match(css,/#turn-label\s*\{[^}]*min-height:2.5em/);
 assert.match(css,/#turn-hint\s*\{[^}]*min-height:2.4em/);
 assert.match(css,/#canvas-wrapper\s*\{flex:none;align-self:center;/);
 assert.doesNotMatch(css,/position\s*:\s*fixed|overflow\s*:\s*hidden|transform\s*:/);
 assert.ok(read('src/main.js').includes("import './neon-p48e-final-polish.css';"));
});
test('P4.8e: single translucent material for all outcomes, shared analysis surface',()=>{
 assert.ok(css.includes('is([data-outcome="victory"],[data-outcome="defeat"],[data-outcome="draw"])'));
 assert.match(css,/\.center-panel\s*\{[^}]*#0b192b99[^}]*backdrop-filter:none!important/);
 assert.doesNotMatch(css,/url\(|var\(--rm-scene\)|\bopacity\s*:/);
 assert.match(css,/\.rm-analysis-stat\s*\{[^}]*border:0;[^}]*background:none/);
 assert.match(css,/\.rm-analysis-stat:last-child strong\s*\{color:var\(--outcome-accent\)/);
});
