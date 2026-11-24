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
 assert.match(html,/opacity:0 !important/);
 assert.match(html,/id="rm-launch-cover"/);
 assert.match(html,/8000/);
 assert.doesNotMatch(html,/root\.dataset\.rmReady = '1'/);
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


test('Existing logo animation starts only after the startup visibility guard releases',()=>{
 const css=read('src/neon-p1-home.css');
 for(const name of ['rim','symbols','wordmark']) {
  const block=css.split('animation:rm-home-logo-'+name)[0].split('}').pop();
  assert.match(block,/\[data-rm-ready="1"\]\[data-rm-intro="1"\]/);
 }
});


test('Startup intro flag is temporary and not set by Home navigation',()=>{
 const js=read('src/main.js');
 assert.equal((js.match(/root\.dataset\.rmIntro='1'/g)||[]).length,1);
 assert.match(js,/delete root\.dataset\.rmIntro/);
 assert.match(js,/setTimeout\(finishIntro,2100\)/);
 assert.match(js,/prefers-reduced-motion: reduce/);
 assert.doesNotMatch(read('src/neon-p1-material.css'),/animation:rm-p13-wordmark/);
});
test('Native launch uses one navy background and avoids stale recents images on API 33+',()=>{
 const java=read('android/app/src/main/java/com/rombmaster/game/MainActivity.java');
 const theme=read('android/app/src/main/res/values/styles.xml');
 assert.match(java,/SplashScreen\.installSplashScreen\(this\);\s*super\.onCreate/);
 assert.match(java,/VERSION_CODES\.TIRAMISU\)\s*\{\s*setRecentsScreenshotEnabled\(false\)/);
 assert.match(java,/setBackgroundColor\(Color\.rgb\(7, 20, 35\)\)/);
 assert.match(theme,/name="windowSplashScreenBackground">#071423/);
 assert.match(theme,/name="postSplashScreenTheme">\@style\/AppTheme.NoActionBar/);
 assert.doesNotMatch(java,/FLAG_SECURE/);
});


test('Core launch reveals Home even when matchMedia is absent, throws, or requests reduced motion',async()=>{
 const vm=require('node:vm');
 const js=read('src/main.js');
 const marker='// Core launch: initialize the full UI and assets before revealing it.';
 assert.ok(js.includes(marker));
 const launch=js.slice(js.indexOf(marker));
 for(const [matchMedia,expectIntro] of [
   [undefined,false],
   [()=>{throw Error('unsupported');},false],
   [()=>({matches:true}),false],
   [()=>({matches:false}),true]
 ]){
   const dataset={skin:'neon'};
   const timers=new Map();
   let id=0;
   const listeners=new Map();
   const context={
     coreEdition:true, window:{matchMedia},
     document:{
       documentElement:{dataset},createElement:()=>({decode:()=>Promise.resolve()}),
       querySelector:()=>null,
       addEventListener:(type,fn)=>listeners.set(type,fn),
       removeEventListener:(type,fn)=>{if(listeners.get(type)===fn)listeners.delete(type);}
     },
     setTimeout:(fn,ms)=>{timers.set(++id,{fn,ms});return id;},
     clearTimeout:id=>timers.delete(id)
   };
   vm.runInNewContext(launch,context);
   await new Promise(resolve=>setImmediate(resolve));
   assert.equal(dataset.rmReady,'1');
   assert.equal(dataset.rmIntro,expectIntro?'1':undefined);
   assert.equal([...timers.values()].some(t=>t.ms===2000),false);
   if(expectIntro){
     listeners.get('click')();
     assert.equal(dataset.rmIntro,undefined);
     assert.equal(listeners.has('click'),false);
   }
 }
});
