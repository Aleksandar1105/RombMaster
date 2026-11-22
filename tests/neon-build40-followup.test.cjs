const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('Android game disables WebView zoom while the page viewport is fixed',()=>{
 const html=read('src/index.html');const java=read('android/app/src/main/java/com/rombmaster/game/MainActivity.java');
 assert.match(html,/maximum-scale=1\.0, user-scalable=no/);
 for(const method of ['setSupportZoom(false)','setBuiltInZoomControls(false)','setDisplayZoomControls(false)'])assert.ok(java.includes(method));
});
test('Core Home shows all six existing opponents, with five levels per rival',()=>{
 const main=read('src/main.js'),css=read('src/neon-screens.css');
 assert.match(main,/const start = coreEdition \? i \* 5 \+ 1 : world\.start/);
 assert.match(main,/const end = coreEdition \? Math\.min\(\(i \+ 1\) \* 5, campaignLimit\) : world\.end/);
 assert.match(main,/card\.hidden = false/);
 assert.match(css,/#premium-rivals-section:not\(\[hidden\]\) \{\s*display:block !important/);
 assert.match(css,/data-current="true"/);
 assert.match(css,/data-state="locked"/);
});
test('Neon Home preserves logos and restores true rendered match button content',()=>{
 const css=read('src/neon-screens.css');
 assert.match(css,/neon-logo-rebuilt-board/);
 assert.match(css,/drop-shadow\(0 0 17px #fb648688\)/);
 assert.match(css,/#view-game #controls,#overlay\.flex \.result-actions/);
 assert.match(css,/opacity:1 !important;visibility:visible !important/);
 assert.match(css,/inset:3px !important/);
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\) !important/);
});
