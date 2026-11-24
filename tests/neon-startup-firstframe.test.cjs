const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');

test('Startup guard lives in initial HTML head before CSS/JS-rendered Home',()=>{
 const html=read('src/index.html');
 assert.match(html,/<html lang="en" data-edition="core">/);
 assert.match(html,/<style id="rm-core-startup-guard">/);
 assert.ok(html.indexOf('id="rm-core-startup-guard"')<html.indexOf('<body>'));
 assert.match(html,/html\[data-edition="core"\]:not\(\[data-rm-ready="1"\]\) #app/);
 assert.match(html,/visibility:hidden !important/);
 assert.match(html,/root\.dataset\.rmReady = '1'/);
 assert.match(html,/3000/);
});

test('Main only releases Core WebView once the local Home assets are ready',()=>{
 const js=read('src/main.js');
 assert.match(js,/if \(coreEdition\) \{\s*const root=document\.documentElement;\s*let revealed=false;/);
 assert.match(js,/root\.dataset\.rmReady='1'/);
 assert.match(js,/background\.src='\/assets\/premium\/master\/neon-home-h6\.webp'/);
 assert.match(js,/document\.querySelector\('#premium-hero-stage \.neon-home-brand > img'\)/);
 assert.match(js,/Promise\.all\(decoded\)\.then\(reveal,reveal\)/);
 assert.match(js,/const fallback=setTimeout\(reveal,2000\)/);
 assert.match(js,/clearTimeout\(fallback\)/);
});

test('Guard has no navigation/save/game changes and preloads offline imagery',()=>{
 const html=read('src/index.html');
 assert.match(html,/rel="preload" as="image" href="\/assets\/premium\/master\/neon-home-h6\.webp"/);
 assert.match(html,/rel="preload" as="image" href="\/assets\/premium\/master\/neon-home-logo\.webp"/);
 const js=read('src/main.js');
 assert.match(js,/Native\.onBack\(\(\) =>/);
 assert.match(js,/mountNeonHomePress\(document\)/);
 assert.match(js,/button\.disabled = !canResume|Game\.refreshSavedGame\(\)/);
 const css=read('src/neon-p1-material.css');
 assert.match(css,/@layer neonControls/);
});
