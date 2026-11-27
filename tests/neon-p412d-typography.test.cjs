const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p412d-typography.css');
test('P4.12d: local fonts scoped to active Neon gameplay and completed results',()=>{
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.ok(selectors.length>=10);
 assert.ok(selectors.every(l=>l.includes('[data-skin="neon"][data-edition="core"]')&&(l.includes('#view-game.active-view')||l.includes('#overlay.flex:is([data-outcome="victory"],[data-outcome="defeat"],[data-outcome="draw"])'))));
 assert.equal((css.match(/@font-face/g)||[]).length,2);
 assert.ok(css.includes("url('/assets/fonts/rombm/exo-2.woff2')"));
 assert.ok(css.includes("url('/assets/fonts/rombm/manrope.woff2')"));
 assert.doesNotMatch(css,/https?:|#view-menu|#canvas|animation:|transform:|font-size:/);
 assert.ok(read('src/main.js').includes("import './neon-p412d-typography.css';"));
});
test('P4.12d: font assets, licenses and exact hashes',()=>{
 const {execFileSync}=require('node:child_process');
 const log=execFileSync(process.execPath,[path.join(__dirname,'..','scripts/verify-p412d-fonts.mjs')],{encoding:'utf8'});
 assert.match(log,/ROMBMASTER_FONTS: PASS/);
});
