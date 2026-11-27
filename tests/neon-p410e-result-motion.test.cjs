const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p410e-result-motion.css');
test('P4.10e: scoped finite motion; no controls or data mutation',()=>{
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.equal(selectors.length,13);
 assert.ok(selectors.every(l=>l.includes('[data-skin="neon"][data-edition="core"] #overlay.flex')&&l.includes('[data-outcome=')));
 assert.ok(css.includes('@media (prefers-reduced-motion:no-preference)'));
 assert.doesNotMatch(css,/#view-game|#view-menu|#home-hub|#againBtn|#backMenuBtn|#nextCareerBtn|pointer-events:|animation-iteration-count:|infinite|display:|visibility:|width:|height:|url\(/);
 const main=read('src/main.js');
 assert.ok(main.includes("import './neon-p410d1-3d-emblems.css';\nimport './neon-p410e-result-motion.css';"));
});
test('P4.10e: perspective, distinct outcomes and existing earned star sound hook',()=>{
 for(const name of ['victory','defeat','draw','draw-left','draw-right','caption','score','metric'])
  assert.ok(css.includes('@keyframes rm-p410e-'+name+' {'));
 assert.match(css,/perspective\(500px\)/);
 assert.match(css,/translateX\(-13%\)/);
 assert.match(css,/translateX\(13%\)/);
 assert.match(css,/\.rm-final-star\[data-earned="true"\]\s*\{[^}]*animation:rm-p47c-star 480ms var\(--star-delay\)/);
 assert.ok(read('src/neon-result.js').includes("event.animationName !== 'rm-p47c-star'"));
 assert.ok(read('src/neon-result.js').includes('game.resultStarCue?.(i)'));
});
