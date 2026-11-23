const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('Neon Core keeps an inert Continue placeholder when no match is resumable',()=>{
 const game=read('src/game.js'), css=read('src/neon-screens.css');
 assert.match(game,/const stableNeonHome = document\.documentElement\?\.dataset\?\.skin === 'neon' &&/);
 assert.match(game,/button\.hidden = !stableNeonHome && !canResume;/);
 assert.match(game,/button\.disabled = !canResume;/);
 assert.match(css,/#continueBtn:disabled/);
 assert.match(css,/pointer-events:none !important/);
});
