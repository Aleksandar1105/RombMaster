const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'../src',name),'utf8');
test('P2.5 motion only targets visible Core Neon Quick Play and respects reduced motion',()=>{
 const css=read('neon-p25-quick-motion.css');
 for(const line of css.split('\n').filter(l=>l.trimStart().startsWith(':root'))){
  assert.ok(line.includes('[data-skin="neon"][data-edition="core"]'));
  assert.ok(line.includes('#view-menu.active-view'));
  assert.ok(line.includes('#menu-page:not([hidden]):has(#quick-settings:not([hidden]))'));
 }
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/transition:none !important;transform:none !important/);
 assert.doesNotMatch(css,/#home-hub|@keyframes|animation:/);
});
test('P2.5 animates only changed board size after render without duplicate feedback',()=>{
 const main=read('main.js');
 assert.match(main,/import '\.\/neon-p25-quick-motion\.css';/);
 assert.match(main,/renderQuickSetup\(\);\s*if \(size !== previousSize && coreEdition/);
 assert.match(main,/animation.id === 'rm-quick-preview-change'\) animation.cancel\(\)/);
 assert.match(main,/duration:180,easing:'ease-out'/);
 assert.equal((main.match(/Game\.playButtonSound\(\);/g)||[]).length,1);
 assert.match(read('neon-p23-quick-glass.css'),/:where\(#page-back,#quick-settings:not\(\[hidden\]\) \.btn-group button,#quick-settings:not\(\[hidden\]\) #setup-play\) \{/);
});
