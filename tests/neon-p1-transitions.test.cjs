const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p1-transitions.css');

test('P1.2 loads transitions last and scopes motion to the active Neon Core view',()=>{
 const js=read('src/main.js');
 assert.match(js,/import '\.\/neon-p1-home\.css';\s*import '\.\/neon-p1-transitions\.css';/);
 assert.match(css,/:root\[data-skin="neon"\]\[data-edition="core"\] #view-menu\.active-view/);
 assert.match(css,/#home-hub\[data-home-revision="3"\][^\n]*:not\(\[hidden\]\)/);
 assert.match(css,/#menu-page:not\(\[hidden\]\) #quick-settings:not\(\[hidden\]\)/);
 assert.match(css,/#menu-page:not\(\[hidden\]\) #career-page:not\(\[hidden\]\)/);
});

test('P1.2 uses distinct <=220ms entry effects and never delays navigation',()=>{
 for (const name of ['rm-p1-home-content-in','rm-p1-quick-in','rm-p1-career-in']) {
   assert.match(css,new RegExp('@keyframes '+name));
   assert.match(css,new RegExp('animation: '+name+' 220ms'));
 }
 assert.doesNotMatch(css,/pointer-events\s*:|setTimeout\(|transition-delay\s*:|animation-delay\s*:|display\s*:|grid-template|position\s*:|top\s*:|left\s*:/);
 assert.match(css,/@media \(prefers-reduced-motion:reduce\)/);
 assert.match(css,/animation:none !important/);
 assert.match(css,/max-height:600px/);
});

test('P1.2 preserves existing screen isolation and native Back implementation',()=>{
 const js=read('src/main.js');
 assert.match(js,/el\('home-hub'\)\.hidden = true;\s*el\('menu-page'\)\.hidden = false;/);
 assert.match(js,/el\('menu-page'\)\.hidden = true;\s*clearNeonHomePress\(document\);\s*el\('home-hub'\)\.hidden = false;/);
 assert.match(js,/Native\.onBack\(\(\) =>/);
 const p1=read('src/neon-p1-home.css');
 assert.match(p1,/animation:rm-home-play-beacon 3\.8s/);
 const neon=read('src/neon-screens.css');
 assert.match(neon,/#view-menu #home-hub\[hidden\]/);
 assert.match(neon,/#view-menu #menu-page\[hidden\]/);
});
