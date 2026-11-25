const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const css=read('src/neon-screens.css').split('/* P1.9 —')[1];

test('P1.9 Home only: larger portraits with compact-height safeguard and unboxed names',()=>{
 assert.ok(css);
 assert.match(css,/:root\[data-skin="neon"\]\[data-edition="core"\] #view-menu #home-hub\[data-home-revision="3"\]\[data-layout="premium"\]\[data-neon-reference="1"\] #premium-rivals-section/);
 assert.match(css,/width:min\(100%,clamp\(40px,13vw,68px\)\)/);
 assert.match(css,/@media \(max-height:680px\) and \(orientation:portrait\)/);
 assert.match(css,/width:min\(100%,clamp\(34px,11vw,50px\)\)/);
 assert.match(css,/\.premium-rival-card strong \{\s*background:transparent !important;border:0 !important;box-shadow:none !important/);
 assert.match(css,/white-space:normal !important;overflow-wrap:anywhere !important/);
 assert.doesNotMatch(css,/#career-page|#view-game|grid-template-rows|grid-template-columns/);
});
test('P1.9 current frame glows while locked rivals remain recognizable and motion-safe',()=>{
 assert.match(css,/\[data-current="true"\] \.reference-rival-frame \{[\s\S]*?animation:rm-p19-current-rival/);
 assert.match(css,/\[data-state="locked"\] img \{\s*filter:saturate\(\.60\) brightness\(\.67\)/);
 assert.match(css,/@media \(prefers-reduced-motion:reduce\)[\s\S]*?animation:none !important/);
 assert.match(read('src/main.js'),/card\.dataset\.current = String\(/);
});
test('P1.9 all six local Home portraits load eagerly without changing Career portrait loading',()=>{
 const html=read('src/index.html');
 const home=html.slice(html.indexOf('<section id="premium-rivals-section"'),html.indexOf('</section>',html.indexOf('<section id="premium-rivals-section"')));
 assert.equal((home.match(/id="home-rival-[0-5]"/g)||[]).length,6);
 assert.equal((home.match(/loading="eager" decoding="async"/g)||[]).length,6);
 assert.match(html,/id="career-rival-card-0"[\s\S]*?loading="lazy"/);
});
