const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const expected={
 victory:[119764,'0288bd18a8dc169f34ad5bec1e7471ea019a78a9564a8009eb88d79de8084a2f'],
 draw:[75706,'8f535a156cf768e6a1307c54c423eba2ef8c600b85e6576cee5f0035c6d59b45'],
 defeat:[110680,'1ff1458b7e271a9c657c27e1b7ae804b68d54b08c4a44943ce53cf1e6c5aec77']
};
test('P4.10d.1: exact Codemagic WebP bytes, alpha and dimensions',()=>{
 for(const [outcome,[bytes,hash]] of Object.entries(expected)){
  const data=fs.readFileSync(path.join(__dirname,'..','src/public/assets/premium/master/neon-3d-'+outcome+'-emblem.webp'));
  assert.equal(data.length,bytes);
  assert.equal(createHash('sha256').update(data).digest('hex'),hash);
  assert.equal(data.toString('ascii',0,4),'RIFF');
  assert.equal(data.toString('ascii',8,16),'WEBPVP8X');
  assert.ok(data[20]&16);
  assert.equal(data.readUIntLE(24,3)+1,640);
  assert.equal(data.readUIntLE(27,3)+1,640);
 }
});
test('P4.10d.1: scoped art and packaging integration only',()=>{
 const css=read('src/neon-p410d1-3d-emblems.css');
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.equal(selectors.length,3);
 assert.ok(selectors.every(l=>l.includes('[data-skin="neon"][data-edition="core"] #overlay.flex[data-outcome=')));
 for(const outcome of Object.keys(expected)) assert.ok(css.includes('/assets/premium/master/neon-3d-'+outcome+'-emblem.webp'));
 assert.doesNotMatch(css,/#view-menu|#view-game|animation:|content:|transform:|display:/);
 assert.ok(read('src/main.js').includes("import './neon-p410d1-3d-emblems.css';"));
 assert.ok(read('scripts/verify-theme-assets.mjs').includes("'neon-p410d1-3d-emblems.css'"));
});
