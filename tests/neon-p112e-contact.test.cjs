const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const css=read('src/neon-screens.css').split('/* P1.12e.1 —')[1];
test('P1.12e.1 portrait V2 contact is aligned with the original single podium',()=>{
 assert.ok(css);
 assert.match(css,/@media \(orientation:portrait\)/);
 assert.match(css,/:root\[data-skin="neon"\]\[data-edition="core"\] #view-menu #home-hub/);
 assert.match(css,/inset:auto 0 22\.5% !important/);
 assert.match(css,/@supports \(width:1cqh\)[\s\S]*?height:auto !important/);
 assert.match(css,/top:76%;width:35%;height:9%/);
 assert.match(css,/pointer-events:none;z-index:1/);
 assert.match(css,/mix-blend-mode:screen/);
 assert.match(read('src/neon-screens.css'),/\.rm-logo-pedestal \{display:none !important/);
 assert.doesNotMatch(css,/#view-game|#menu-page|grid-template|background-image:url/);
});
test('P1.12e.1 wordmark edge blend and contact respect the existing startup timeline',()=>{
 assert.match(css,/mask-composite:intersect !important/);
 assert.match(css,/-webkit-mask-composite:source-in !important/);
 assert.match(css,/linear-gradient\(to right,transparent 0%,#000 9%,#000 91%,transparent 100%\)/);
 assert.match(css,/\[data-rm-intro="1"\][^\n]*::after \{animation:rm-v2-scene-in \.45s ease-out 2\.12s both/);
 assert.match(css,/@media \(prefers-reduced-motion:reduce\)/);
 assert.match(read('src/neon-p1-home.css'),/animation:rm-intro-ui \.35s ease-out 2\.70s both!important/);
});
