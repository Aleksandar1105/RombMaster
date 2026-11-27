const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p412a-turn-status.css');
test('P4.12a: faceted turn card only, preserves live status and accessibility',()=>{
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.ok(selectors.length>=12);
 assert.ok(selectors.every(l=>l.includes('[data-skin="neon"][data-edition="core"] #view-game.active-view #turn-status[data-player]')));
 assert.match(css,/clip-path:var\(--turn-cut\)/);
 assert.match(css,/grid-row:1\/3/);
 assert.doesNotMatch(css,/#canvas|#controls|#match-mode|#scoreboard|#overlay|#view-menu|backdrop-filter|infinite/);
 const main=read('src/main.js');
 assert.ok(main.includes("import './neon-p410e-result-motion.css';\nimport './neon-p412a-turn-status.css';"));
 assert.match(read('src/index.html'),/id="turn-status"[^>]+role="status"[^>]+aria-live="polite"/);
});
test('P4.12a: two-line slots, all states, and finite optional icon motion',()=>{
 assert.match(css,/#turn-label\s*\{[^}]*min-height:2\.2em[^}]*line-height:1\.1/);
 assert.match(css,/#turn-hint\s*\{[^}]*min-height:2\.3em[^}]*line-height:1\.15/);
 assert.match(css,/overflow-wrap:anywhere/);
 for(const state of ['extra','paused','complete'])assert.ok(css.includes('[data-turn-kind="'+state+'"]'));
 for(const player of ['one','two'])assert.ok(css.includes('[data-player="'+player+'"]'));
 assert.ok(css.includes('@media (prefers-reduced-motion:no-preference)'));
 assert.match(css,/animation:rm-p412a-extra 360ms ease-out both/);
 assert.match(css,/animation:none/);
});
