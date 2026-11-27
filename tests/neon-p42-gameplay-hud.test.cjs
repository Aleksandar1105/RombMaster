const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p42-gameplay-hud.css');
test('P4.2 HUD is isolated to Core Neon gameplay and contextual match dialog',()=>{
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.ok(selectors.length>20);
 assert.ok(selectors.every(l=>l.includes('[data-skin="neon"][data-edition="core"]')&&l.includes('#view-game.active-view')));
 assert.ok(!css.includes('#home-hub')&&!css.includes('#overlay')&&!css.includes('#canvas'));
 assert.ok(read('src/main.js').includes("import './neon-p42-gameplay-hud.css';"));
});
test('P4.2 uses actual scoreboard, turn and existing control states',()=>{
 const html=read('src/index.html');
 for(const id of ['p1-score','p2-score','turn-label','turn-hint','undoBtn','restartBtn','game-sound-btn','menuBtn','confirm-dialog-accept','confirm-dialog-cancel']) assert.ok(html.includes('id="'+id+'"'));
 assert.ok(css.includes('.player-card.active::before')&&css.includes('.btn-icon:is(.disabled,:disabled)'));
 assert.ok(css.includes(':focus-visible')&&css.includes('min-height:44px'));
 assert.ok(css.includes('linear-gradient(142deg,var(--hud-facet)'));
 assert.ok(css.includes('mask-image:radial-gradient'));
});
