const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const css=read('src/neon-screens.css').split('/* P1.11 —')[1]?.split('/* P1.12a —')[0];

test('P1.11 neutralizes the legacy rival caption plate including its generated surface',()=>{
 assert.ok(css);
 assert.match(read('src/skin-store-compact.css'),/\.premium-rival-card > strong::before/);
 assert.match(css,/\.premium-rival-card > strong::before \{\s*content:none !important;display:none !important/);
 assert.match(css,/clip-path:none !important;height:auto !important/);
 assert.match(css,/background:none !important;background-image:none !important/);
 assert.doesNotMatch(css,/#career-page|#menu-page|#view-game/);
});
test('P1.11 portrait logo and action rows no longer spill into adjacent grid rows',()=>{
 assert.match(css,/@media \(orientation:portrait\)/);
 assert.match(css,/:is\(\.play-row,\.mode-grid\) \{\s*transform:none !important/);
 assert.match(css,/#premium-hero-stage:not\(\[hidden\]\) \{\s*transform:none !important;\s*overflow:hidden !important/);
 assert.match(css,/\.neon-home-brand > :is\(img,\.neon-logo-rebuilt-board\) \{\s*transform:none !important/);
});
test('P1.11 startup completion prevents the old Home fade and restores regular navigation',()=>{
 const js=read('src/main.js'),home=read('src/neon-p1-home.css');
 assert.match(js,/root\.dataset\.rmIntroSettled='1';\s*delete root\.dataset\.rmIntro/);
 assert.match(js,/function showHome\(\) \{\s*if\(document\.documentElement\?\.dataset\) delete document\.documentElement\.dataset\.rmIntroSettled/);
 assert.match(js,/clearTimeout\(introTimer\)/);
 assert.match(home,/\[data-rm-intro-settled="1"\][\s\S]*?animation:none !important/);
});
