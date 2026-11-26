const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'../src',name),'utf8');
const css=read('neon-p26e-quick-fit.css');
test('P2.6e imports after P2.6c and scopes every rule to visible Core Neon Quick Play',()=>{
 assert.match(read('main.js'),/import '\.\/neon-p26-quick-polish\.css';\s*import '\.\/neon-p26e-quick-fit\.css';/);
 for(const line of css.split('\n').filter(l=>l.trimStart().startsWith(':root'))){
  for(const selector of line.split(/,:(?=root)/)){
   assert.ok(selector.includes('[data-skin="neon"][data-edition="core"]'));
   assert.ok(selector.includes('#menu-page:not([hidden])'));
   assert.ok(selector.includes('#quick-settings:not([hidden])'));
  }
 }
 assert.doesNotMatch(css,/#home-hub|url\(/);
});
test('P2.6e keeps normal portrait layout compact and allows accessible overflow',()=>{
 assert.match(css,/overflow-y:auto !important/);
 assert.match(css,/100dvh - max\(6px,env\(safe-area-inset-top\)\)/);
 assert.match(css,/min-height:44px !important/);
 assert.match(css,/:has\(#difficulty-wrapper\[hidden\]\) #setup-preview/);
 assert.match(css,/#setup-play \{align-self:end !important/);
});
test('P2.6e chamfers, horizontal mode icons and title underline retain existing controls',()=>{
 assert.match(css,/--qp-cut:7px;clip-path:polygon/);
 assert.match(css,/button\[data-ai\] > svg \{\s*grid-column:1;grid-row:1\/3/);
 assert.match(css,/button\[data-ai\] > strong \{\s*grid-column:2;grid-row:1/);
 assert.match(css,/#page-title::after/);
 assert.match(css,/font-family:Orbitron,Rajdhani/);
});
test('P2.6e replaces CTA breathing with finite sheen and respects reduced motion',()=>{
 assert.match(css,/#setup-play:not\(:disabled\)::before \{animation:none !important/);
 assert.match(css,/animation:rm-quick-p26e-sheen 3\.2s ease-in-out 2 !important/);
 assert.match(css,/animation:rm-quick-p26e-select 220ms ease-out 1/);
 assert.match(css,/prefers-reduced-motion:reduce[\s\S]*?animation:none !important/);
});