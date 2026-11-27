const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p410a-gameplay-arena.css');
test('P4.10a: approved 2K arena is bundled with exact imported bytes',()=>{
 const data=fs.readFileSync(path.join(__dirname,'..','src/public/assets/premium/master/neon-gameplay-arena-v2.webp'));
 assert.equal(data.length,104344);
 assert.equal(data.subarray(0,4).toString(),'RIFF');
 assert.equal(data.subarray(8,12).toString(),'WEBP');
 assert.equal(createHash('sha256').update(data).digest('hex'),'e37caeac1f57da0f81e14c70cb26baa88f7da1ac3eb6439470845a2468bbe056');
 assert.ok(read('scripts/verify-theme-assets.mjs').includes("'neon-p410a-gameplay-arena.css'"));
});
test('P4.10a: match and finished results only, no layout or input changes',()=>{
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.equal(selectors.length,4);
 assert.ok(selectors.every(l=>l.includes('[data-skin="neon"][data-edition="core"]')&&(l.includes('#view-game.active-view')||l.includes('#overlay.flex:is([data-outcome="victory"],[data-outcome="defeat"],[data-outcome="draw"])'))));
 assert.ok(css.includes('@layer neonControls'));
 assert.ok(css.includes('orientation:landscape'));
 assert.ok(!/https?:|#view-menu|#home-hub|#canvas|\.center-panel|pointer-events/.test(css.replace(/\/\*[\s\S]*?\*\//g,'')));
 assert.ok(read('src/main.js').includes("import './neon-p410a-gameplay-arena.css';"));
});
