const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'../src',name),'utf8');
const css=read('neon-p26f-quick-finish.css');
test('P2.6f removes the visual tick only in visible Core Neon Quick Play',()=>{
 assert.match(read('main.js'),/import '\.\/neon-p26e-quick-fit\.css';\s*import '\.\/neon-p26f-quick-finish\.css';/);
 assert.match(css,/button\[aria-pressed="true"\]::after \{\s*content:none !important;display:none !important/);
 for(const line of css.split('\n').filter(l=>l.trimStart().startsWith(':root'))){
  assert.ok(line.includes('[data-skin="neon"][data-edition="core"]'));
  assert.ok(line.includes('#menu-page:not([hidden])'));
  assert.ok(line.includes('#quick-settings:not([hidden])'));
 }
 assert.doesNotMatch(css,/#home-hub|grid-template|neon-tactical-arena/);
});
test('P2.6f title is an offline vector with text fallback and asset verification',()=>{
 assert.match(css,/url\('\/assets\/premium\/master\/quick-play-title\.svg'\)/);
 assert.match(css,/forced-colors:none/);
 assert.match(read('public/assets/premium/master/quick-play-title.svg'),/<title>QUICK PLAY<\/title>/);
 assert.match(fs.readFileSync(path.join(__dirname,'../scripts/verify-theme-assets.mjs'),'utf8'),/neon-p26f-quick-finish\.css/);
});
test('P2.6f preview glow and CTA sweep preserve finite reduced-motion behavior',()=>{
 assert.match(css,/#setup-preview \{\s*filter:drop-shadow/);
 assert.match(css,/animation:rm-quick-p26f-sweep 3\.2s ease-in-out 2 !important/);
 assert.match(css,/prefers-reduced-motion:reduce[\s\S]*?animation:none !important;opacity:0 !important/);
});