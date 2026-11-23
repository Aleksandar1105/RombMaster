const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
test('Neon Home picture loads from bundled offline asset, not Picsart CDN',()=>{
 const css=read('src/neon-screens.css');
 assert.match(css,/url\('\/assets\/premium\/master\/neon-home-calm-300\.webp'\)/);
 assert.doesNotMatch(css,/gcdn\.picsart\.com/);
 const bytes=fs.readFileSync(path.resolve(__dirname,'../src/public/assets/premium/master/neon-home-calm-300.webp'));
 assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
});
test('Neon Core removes Home rival level subtitles but Career still displays intervals',()=>{
 const css=read('src/neon-screens.css'),js=read('src/main.js');
 assert.match(css,/#premium-rivals-section \.premium-rival-card > small \{ display:none !important/);
 assert.match(js,/levelLabel\.textContent = 'Levels ' \+ start/);
});
test('Career navigation retains one Back handler and readable level states',()=>{
 const js=read('src/main.js'),css=read('src/neon-screens.css');
 assert.match(js,/el\('page-back'\)\.onclick = /);
 assert.match(js,/\?\s*'🔒 Locked'/);
 assert.match(js,/\?'✓ Completed · '/);
 assert.match(js,/:'▶ Play now'/);
 assert.match(css,/#chapter-route button\[aria-pressed="true"\]/);
 assert.match(css,/#page-back::after \{\s*content:none/);
});
