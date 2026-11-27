const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p410d-transparent-emblems.css');
test('P4.10d: victory reference WebP contains real alpha; SVGs have no opaque canvas',()=>{
 const data=fs.readFileSync(path.join(__dirname,'..','src/public/assets/premium/reference/victory-medallion.webp'));
 assert.equal(data.subarray(0,4).toString(),'RIFF');
 assert.equal(data.subarray(8,12).toString(),'WEBP');
 assert.equal(data.subarray(12,16).toString(),'VP8X');
 assert.ok(data[20]&0x10,'extended WebP alpha flag');
 let alpha=false;
 for(let pos=12;pos+8<=data.length;){
  const size=data.readUInt32LE(pos+4);
  if(data.subarray(pos,pos+4).toString()==='ALPH') alpha=true;
  pos+=8+size+(size%2);
 }
 assert.ok(alpha,'ALPH chunk present');
 for(const outcome of ['defeat','draw']){
  const svg=read('src/skin-art/neon-'+outcome+'-emblem.svg');
  assert.match(svg,/<svg[^>]+viewBox="0 0 240 240"/);
  assert.doesNotMatch(svg,/<rect\b|<image\b|<foreignObject\b/i);
 }
});
test('P4.10d: only finished Core Neon outcome art; preserves earlier motion and size',()=>{
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.equal(selectors.length,3);
 assert.ok(selectors.every(l=>l.includes('[data-skin="neon"][data-edition="core"] #overlay.flex')&&l.includes('[data-outcome=')));
 assert.ok(css.includes("url('/assets/premium/reference/victory-medallion.webp')"));
 assert.ok(css.includes('mask-image:none!important'));
 assert.doesNotMatch(css,/#view-game|#view-menu|#home-hub|\.center-panel|animation:|aspect-ratio:|transform:|content:/);
 assert.ok(read('src/main.js').includes("import './neon-p410d-transparent-emblems.css';"));
});
