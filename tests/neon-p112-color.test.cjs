const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
test('P1.12c glass colors harmonize Home only while preserving the material and controls',()=>{
 const css=read('src/neon-p1-material.css');
 assert.match(css,/@layer neonControls/);
 assert.match(css,/#246087 24%,#123957 50%,#091b34 73%,#21688c/);
 assert.match(css,/#a34df5 25%,#6735ac 66%,#f15be5/);
 assert.match(css,/#995ad3 24%,#452375 53%,#21143e/);
 assert.match(css,/#e77affb3/);
 assert.doesNotMatch(css,/#view-game|#menu-page|grid-template|grid-column/);
});
test('P1.12c logo trace and header use cyan-magenta while keeping X/O marks unchanged',()=>{
 const html=read('src/index.html'),css=read('src/neon-screens.css'),intro=read('src/neon-p1-home.css');
 assert.match(html,/d="M779 462 L540 701 L301 462" pathLength="1" fill="none" stroke="#f15be5"/);
 assert.match(html,/cx="779" cy="462" r="10" fill="#fff0ff" stroke="#f15be5"/);
 assert.match(html,/stroke="#ff7289"/);
 assert.match(html,/stroke="#21e9f9"/);
 assert.match(css,/#5274f5 65%,#f15be5\) border-box/);
 assert.match(intro,/animation:rm-intro-ui \.35s ease-out 2\.70s both!important/);
});
