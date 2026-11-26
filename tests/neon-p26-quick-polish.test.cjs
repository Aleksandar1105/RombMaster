const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'../src',name),'utf8');
const css=read('neon-p26-quick-polish.css');
test('P2.6c polish imports after motion and targets only visible Core Neon Quick Play',()=>{
 assert.match(read('main.js'),/import '\.\/neon-p25-quick-motion\.css';\s*import '\.\/neon-p26-quick-polish\.css';/);
 for(const line of css.split('\n').filter(l=>l.trimStart().startsWith(':root'))){
  assert.ok(line.includes('[data-skin="neon"][data-edition="core"]'));
  assert.ok(line.includes('#menu-page:not([hidden])'));
  assert.ok(line.includes('#quick-settings:not([hidden])'));
 }
 assert.doesNotMatch(css,/#home-hub|https?:\/\//);
});
test('P2.6c local tactical background is a bounded WebP included in asset verification',()=>{
 const asset=fs.readFileSync(path.join(__dirname,'../src/public/assets/premium/master/neon-tactical-arena-v1.webp'));
 assert.equal(asset.subarray(0,4).toString(),'RIFF');
 assert.equal(asset.subarray(8,12).toString(),'WEBP');
 assert.equal(asset.readUInt32LE(4)+8,asset.length);
 assert.ok(asset.length<=512*1024);
 assert.match(css,/url\('\/assets\/premium\/master\/neon-tactical-arena-v1\.webp'\)/);
 assert.match(fs.readFileSync(path.join(__dirname,'../scripts/verify-theme-assets.mjs'),'utf8'),/neon-p26-quick-polish\.css/);
});
test('P2.6c differentiated material keeps selector precedence, focus and reduced motion',()=>{
 assert.match(css,/:where\(#page-back,#quick-settings:not\(\[hidden\]\) \.btn-group button,#quick-settings:not\(\[hidden\]\) #setup-play\)/);
 assert.match(css,/button\[aria-pressed="true"\][\s\S]*?--qp-glass-light:#dc6cff/);
 assert.match(css,/#setup-play:not\(:disabled\)[\s\S]*?--qp-glass-light:#ff4c62/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/prefers-reduced-motion:reduce[\s\S]*?animation:none !important/);
 assert.match(css,/rm-quick-p26-glass-breathe 2\.4s ease-in-out 3/);
});
