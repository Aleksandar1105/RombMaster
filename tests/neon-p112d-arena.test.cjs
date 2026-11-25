const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
test('P1.12d verified WebP artwork is bundled offline',()=>{
 const bytes=fs.readFileSync(path.resolve(__dirname,'../src/public/assets/premium/master/neon-arena-v2.webp'));
 assert.equal(bytes.subarray(0,4).toString(),'RIFF');
 assert.equal(bytes.subarray(8,12).toString(),'WEBP');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'4f3448c8d2bfbdb50b240ed1c0813b16d74aeae9fe935e8032b3a353c8632a03');
 assert.match(read('src/index.html'),/href="\/assets\/premium\/master\/neon-arena-v2\.webp" media="\(orientation:portrait\)"/);
 assert.match(read('src/main.js'),/const decoded=\[background,arena,wordmark\]/);
});
test('P1.12d one scene podium follows the Core portrait hero while other skins retain their artwork',()=>{
 const css=read('src/neon-screens.css').split('/* P1.12d —')[1];
 assert.ok(css);
 assert.match(css,/@media \(orientation:portrait\)/);
 assert.match(css,/:root\[data-skin="neon"\]\[data-edition="core"\] #view-menu #home-hub/);
 assert.match(css,/background-size:100% 100%,100% 222\.222%/);
 assert.match(css,/width:min\(100%,120cqh\)/);
 assert.match(css,/aspect-ratio:3 \/ 2/);
 assert.match(css,/\.rm-logo-pedestal \{display:none !important/);
 assert.match(css,/animation:rm-v2-scene-in \.45s ease-out 2\.12s both/);
 assert.match(css,/@media \(prefers-reduced-motion:reduce\)/);
 assert.doesNotMatch(css,/https?:|#view-game|#menu-page|grid-template/);
 assert.match(read('src/skin-store-compact.css'),/neon-home-h6\.webp/);
});
