const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('P0.3 improves Home/Quick Play minimum label readability without touching grid',()=>{
 const neon=read('src/neon-screens.css'),compact=read('src/skin-store-compact.css');
 assert.match(neon,/font-size:clamp\(\.74rem,2\.95vw,\.92rem\) !important;/);
 assert.match(compact,/font-size:clamp\(\.74rem,3vw,\.88rem\)!important;/);
 assert.match(compact,/font-size:clamp\(\.76rem,2\.9vw,1rem\)/);
 assert.match(compact,/font-size:clamp\(\.69rem,2\.25vw,\.78rem\)/);
 assert.match(neon,/grid-template-columns: repeat\(3,minmax\(0,1fr\)\) !important/);
});
test('P0.3 reinforces icon strokes and preserves a disabled Continue',()=>{
 const neon=read('src/neon-screens.css'),compact=read('src/skin-store-compact.css');
 assert.match(neon,/#startBtn > svg\[aria-hidden="true"\]/);
 assert.match(neon,/stroke-width:2 !important/);
 assert.match(compact,/stroke-width:1\.9;stroke-linecap:round/);
 assert.match(compact,/opacity:1;stroke:currentColor;stroke-width:1\.9;width:20px;height:20px/);
 assert.match(neon,/#continueBtn:disabled/);
 assert.match(neon,/#overlay\.flex \.result-actions button/);
});
