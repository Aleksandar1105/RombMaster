const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p410b-compact-hud.css');
test('P4.10b: portrait Core Neon HUD and result headings only',()=>{
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.equal(selectors.length,14);
 assert.ok(selectors.every(l=>l.includes('[data-skin="neon"][data-edition="core"]')&&(l.includes('#view-game.active-view')||l.includes('#overlay.flex:is([data-outcome="victory"],[data-outcome="defeat"],[data-outcome="draw"])'))));
 assert.ok(!/#view-menu|#home-hub|#canvas|#controls|#againBtn|#backMenuBtn|animation:|content:|display:|url\(/.test(css));
 const main=read('src/main.js');
 assert.ok(main.includes("import './neon-p410a-gameplay-arena.css';\nimport './neon-p410b-compact-hud.css';"));
});
test('P4.10b: stable two-line slots and compact short portrait',()=>{
 assert.match(css,/#match-mode\s*\{[^}]*min-height:calc\(2\.5em \+ 8px\)/);
 assert.match(css,/#turn-label\s*\{[^}]*line-height:1\.2;min-height:2\.4em/);
 assert.match(css,/#turn-hint\s*\{[^}]*line-height:1\.15;min-height:2\.3em/);
 assert.ok(css.includes('(orientation:portrait) and (max-height:700px)'));
 assert.ok(css.includes('font-size:clamp(.7rem,2.85vw,.82rem)'));
});
