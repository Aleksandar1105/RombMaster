// Real viewport QA against dist, using an isolated local Chromium profile.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn,execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';

const root=process.cwd(),dist=path.join(root,'dist');
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const out=path.join(root,'qa-logs','visual3-browser-'+commit.slice(0,7));
await fs.mkdir(out,{recursive:true});
const results=[],errors=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser,ws,server,temp;
async function exists(f){try{await fs.access(f);return true;}catch{return false;}}
async function until(fn,label,ms=15000){
 const end=Date.now()+ms;
 while(Date.now()<end){const v=await fn();if(v)return v;await sleep(100);}
 throw Error('Timeout: '+label);
}
function record(name,status,details=''){results.push({name,status,details});console.log(status+' '+name+(details?' — '+details:''));}
async function check(name,fn){
 try{const d=await fn();record(name,'PASS',typeof d==='string'?d:'');}
 catch(e){record(name,'FAIL',e.message);}
}
// This function is executed in the actual browser, not in a DOM mock.
function inspectHome(){
 const menu=document.getElementById('view-menu'),hub=document.getElementById('home-hub');
 const b=menu.getBoundingClientRect(),failures=[];
 const visible=e=>e&&!e.closest('[hidden]')&&getComputedStyle(e).display!=='none';
 for(const e of hub.querySelectorAll('button')){
  if(!visible(e))continue;
  const r=e.getBoundingClientRect(),label=e.id||e.dataset.page||e.textContent.trim();
  if(r.x<Math.max(0,b.x)-1||r.y<Math.max(0,b.y)-1||r.right>Math.min(innerWidth,b.right)+1||r.bottom>Math.min(innerHeight,b.bottom)+1||r.width<43||r.height<43)
   failures.push(label+': outside viewport or below 44px target '+JSON.stringify(r.toJSON()));
  if(!e.closest('[inert]')&&!e.disabled){
   const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
   if(!(hit===e||e.contains(hit)))failures.push(label+': covered or clipped');
  }
 }
 for(const id of ['home-skins','home-skin-store','startBtn','daily-open-btn','helpBtn'])
  if(!visible(document.getElementById(id)))failures.push(id+': missing');
 const hero=document.getElementById('premium-hero-stage');
 if(visible(hero)&&hero.getBoundingClientRect().height<70)failures.push('Hero stage below 70px');
 const imgs=[...hub.querySelectorAll('.premium-rivals-strip img')].filter(visible);
 if(imgs.some(i=>!i.complete||!i.naturalWidth))failures.push('Missing rival image');
 if(menu.scrollHeight>menu.clientHeight+2)failures.push('Vertical overflow '+menu.scrollHeight+'/'+menu.clientHeight);
 if(menu.scrollWidth>menu.clientWidth+2)failures.push('Horizontal overflow');
 if(getComputedStyle(menu).overflowY!=='hidden')failures.push('Home scroll enabled');
 return {failures,width:innerWidth,height:innerHeight,hero:Math.round(hero.getBoundingClientRect().height),skin:document.documentElement.dataset.skin};
}
try{
 await fs.access(path.join(dist,'index.html'));
 const candidates=[process.env.ROMBMASTER_BROWSER,...[process.env['ProgramFiles(x86)'],process.env.ProgramFiles,process.env.LOCALAPPDATA].filter(Boolean).flatMap(p=>[path.join(p,'Microsoft','Edge','Application','msedge.exe'),path.join(p,'Google','Chrome','Application','chrome.exe')])].filter(Boolean);
 let executable;for(const f of candidates)if(await exists(f)){executable=f;break;}
 if(!executable)throw Error('Edge/Chrome missing; set ROMBMASTER_BROWSER to the executable path.');
 temp=await fs.mkdtemp(path.join(os.tmpdir(),'rombmaster-visual-'));
 const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'};
 server=http.createServer(async(req,res)=>{
  try{
   const u=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
   const f=path.resolve(dist,'.'+(u==='/'?'/index.html':u));
   if(!f.startsWith(dist+path.sep)){res.writeHead(403);res.end();return;}
   const data=await fs.readFile(f);
   res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
  }catch{res.writeHead(404);res.end();}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const url='http://127.0.0.1:'+server.address().port+'/';
 browser=spawn(executable,['--headless=new','--disable-gpu','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+temp,'about:blank'],{stdio:'ignore',windowsHide:true});
 let launchError;browser.on('error',e=>{launchError=e;});
 const port=await until(async()=>{
  if(launchError)throw launchError;
  if(browser.exitCode!==null)throw Error('Browser exited: '+browser.exitCode);
  try{return Number((await fs.readFile(path.join(temp,'DevToolsActivePort'),'utf8')).split(/\r?\n/)[0])||false;}catch{return false;}
 },'isolated browser',20000);
 const target=await until(async()=>{try{return (await(await fetch('http://127.0.0.1:'+port+'/json/list')).json()).find(t=>t.type==='page');}catch{return false;}},'browser page');
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 let seq=0;const pending=new Map();
 ws.addEventListener('message',event=>{
  const m=JSON.parse(event.data);
  if(m.id){const cb=pending.get(m.id);if(cb){pending.delete(m.id);clearTimeout(cb.timer);m.error?cb.reject(Error(m.error.message)):cb.resolve(m.result);}}
  if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails?.exception?.description||m.params.exceptionDetails?.text);
  if(m.method==='Network.responseReceived'&&m.params.response.url.startsWith(url)&&m.params.response.status>=400&&!m.params.response.url.endsWith('/favicon.ico'))errors.push('HTTP '+m.params.response.status+' '+m.params.response.url);
 });
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method));},20000);
  pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));
 });
 const evaluate=async expression=>{
  const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;
 };
 await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Network.enable');
 await cdp('Page.bringToFront');await cdp('Emulation.setFocusEmulationEnabled',{enabled:true});
 const viewport=async(width,height)=>{
  await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true,screenOrientation:{type:width>height?'landscapePrimary':'portraitPrimary',angle:width>height?90:0}});await sleep(350);
 };
 const loaded=async()=>{
  await until(()=>evaluate("document.readyState==='complete' && !!document.documentElement.dataset.skin && !!document.getElementById('game-sound-label')"),'app startup');
  await evaluate("Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,3000))]).then(()=>true)");await sleep(350);
 };
 const shot=async name=>{
  await evaluate("Promise.all([...document.images].filter(i=>i.getBoundingClientRect().width>0).map(i=>i.decode().catch(()=>{}))).then(()=>true)");
  await sleep(300);
  await evaluate("Promise.race([new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))),new Promise(r=>setTimeout(r,1200))]).then(()=>true)");
  const {cssVisualViewport:v}=await cdp('Page.getLayoutMetrics');
  const {data}=await cdp('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false,clip:{x:v.pageX,y:v.pageY,width:v.clientWidth,height:v.clientHeight,scale:1}});
  await fs.writeFile(path.join(out,name+'.png'),Buffer.from(data,'base64'));
 };
 const click=async(sel,scroll=false)=>{
  const locate='(()=>{const e=document.querySelector('+JSON.stringify(sel)+');if(!e||e.disabled||e.closest("[hidden]"))return null;const b=e.getBoundingClientRect();const x=b.x+b.width/2,y=b.y+b.height/2;const hit=document.elementFromPoint(x,y);return {x,y,hit:e===hit||e.contains(hit),hitTag:hit?.id||hit?.tagName};})()';
  if(scroll)await evaluate('document.querySelector('+JSON.stringify(sel)+')?.scrollIntoView({block:"center",behavior:"instant"})');
  await sleep(300);
  let r;
  await until(async()=>{const a=await evaluate(locate);await sleep(100);const b=await evaluate(locate);r=b;return a?.hit&&b?.hit&&Math.abs(a.x-b.x)<1&&Math.abs(a.y-b.y)<1;},'stable reachable control '+sel,4000);
  assert.ok(r?.hit,'Control is not reachable: '+sel);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:r.x,y:r.y});
  await cdp('Input.dispatchMouseEvent',{type:'mousePressed',x:r.x,y:r.y,button:'left',clickCount:1});
  await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:r.x,y:r.y,button:'left',clickCount:1});await sleep(350);
 };
 const homeLayout=async()=>{
  const d=await evaluate('('+inspectHome.toString()+')()');
  assert.equal(d.failures.length,0,JSON.stringify(d));return d.width+'x'+d.height+', hero '+d.hero+'px, '+d.skin;
 };
 await viewport(412,860);await cdp('Page.navigate',{url});await loaded();
 for(const [w,h] of [[320,568],[360,640],[412,860],[480,900],[844,390]]){
  await viewport(w,h);await shot('home-neon-'+w+'x'+h);await check('Home '+w+'x'+h,homeLayout);
 }
 await viewport(412,860);
 await check('Skins opens My Collection',async()=>{
  await click('#home-skins');
  assert.equal(await evaluate("document.getElementById('page-title').textContent"),'My Collection');
  assert.equal(await evaluate("document.getElementById('skin-tab-collection').getAttribute('aria-pressed')"),'true');
  await shot('my-collection');await click('#page-back',true);
 });
 await check('Skin Store opens six base skins',async()=>{
  await click('#home-skin-store');
  assert.equal(await evaluate("document.getElementById('page-title').textContent"),'Skin Store');
  assert.equal(await evaluate("document.querySelectorAll('#skin-options .skin-card').length"),6);
  await shot('skin-store');
 });
 const storageSkin=()=>evaluate("JSON.stringify(Object.keys(localStorage).filter(k=>k.includes('rombmaster_skin_v1')).sort().map(k=>[k,localStorage.getItem(k)]))");
 const priorSkin=await evaluate("document.documentElement.dataset.skin"),priorPrefs=await storageSkin();
 for(const [tab,ids] of [
 ['#skin-tab-store',['neon','royal','cyber','ice','wood','white']],
 ['#skin-tab-seasonal',['frozen-christmas','golden-dragon','spring-blossom','summer-paradise','autumn-kingdom','halloween-curse','midnight-gold']]
 ]){
  await click(tab,true);
  await check('Catalog '+tab,async()=>assert.equal(await evaluate("document.querySelectorAll('#skin-options .skin-card').length"),ids.length));
  for(const id of ids)await check('Home preview '+id,async()=>{
   try{
    await click('[data-skin-id="'+id+'"]',true);
    await click('#skin-home-preview',true);
    const state=await evaluate("({skin:document.documentElement.dataset.skin,homeHidden:document.getElementById('home-hub').hidden,storeHidden:document.getElementById('skin-page').hidden,menuHidden:document.getElementById('menu-page').hidden,previewHidden:document.getElementById('home-preview-bar').hidden,selected:document.getElementById('skin-stage').dataset.previewSkin,visibility:document.visibilityState})");
    if(state.skin!==id||state.homeHidden||state.previewHidden) {
     await shot('failed-preview-'+id);
     throw Error('Preview did not open: '+JSON.stringify(state));
    }
    assert.equal(await evaluate("document.documentElement.dataset.skin"),id);
    assert.equal(await evaluate("document.querySelector('.home-actions').inert"),true);
    await shot('preview-'+id);
    const art=await evaluate(`(async()=>{
      const name=${JSON.stringify(id)}+'-reference-hero.webp';
      const hero=document.getElementById('premium-hero-stage');
      const background=getComputedStyle(hero).backgroundImage;
      const urls=Array.from(background.matchAll(/url\\(["']?([^"')]+)["']?\\)/g),m=>m[1]);
      const first=urls[0]||'';
      if(!first.endsWith('/assets/premium/reference/'+name))return {ok:false,background,name};
      const image=new Image();
      image.src=first;
      try{await image.decode();}catch(e){return {ok:false,background,name,error:String(e)};}
      return {ok:image.naturalWidth>0&&image.naturalHeight>0,name,width:image.naturalWidth,height:image.naturalHeight};
    })()`);
    assert.equal(art.ok,true,'Hero artwork mismatch: '+JSON.stringify(art));
    return (await homeLayout())+', '+art.name+' '+art.width+'x'+art.height;
   }finally{
    if(await evaluate("!document.getElementById('home-preview-bar').hidden"))await click('#home-preview-close');
    assert.equal(await evaluate("document.documentElement.dataset.skin"),priorSkin);
    assert.equal(await storageSkin(),priorPrefs,'Preview changed stored skin');
   }
  });
 }
 await check('Locked seasonal skin cannot be equipped',async()=>{
  await click('[data-skin-id="halloween-curse"]',true);
  assert.equal(await evaluate("document.getElementById('skin-equip').disabled"),true);
  await click('#page-back',true);
 });
 await check('In-match sound toggle and persistence',async()=>{
  // Select a deterministic local PvP board; no AI racing the sound check.
  await click('[data-page="quick-settings"]');
  await click('[data-size="4"]',true);
  await click('[data-ai="pvp"]',true);
  await click('#page-back',true);
  await cdp('Page.bringToFront');
  await click('#startBtn');
  await until(()=>evaluate("document.getElementById('view-game').classList.contains('active-view')"),'quick match');
  await sleep(400);await shot('game-sound-on');
  const liveBoard=await evaluate("(()=>{const c=document.getElementById('canvas'),ctx=c.getContext('2d'),p=ctx.getImageData(0,0,c.width,c.height).data;let painted=0;for(let i=0;i<p.length;i+=4)if(p[i]||p[i+1]||p[i+2])painted++;return {turn:document.getElementById('turn-label').textContent,visibility:document.visibilityState,width:c.width,height:c.height,painted:painted/(p.length/4)};})()");
  assert.equal(liveBoard.visibility,'visible',JSON.stringify(liveBoard));
  assert.doesNotMatch(liveBoard.turn,/paused/i,JSON.stringify(liveBoard));
  assert.ok(liveBoard.width>=120&&liveBoard.height>=120&&liveBoard.painted>0.1,JSON.stringify(liveBoard));
  assert.equal(await evaluate("document.getElementById('undoBtn').classList.contains('disabled')"),true);
  const edge=await evaluate("(()=>{const c=document.getElementById('canvas'),r=c.getBoundingClientRect(),w=parseFloat(c.style.width),cell=(w-14)/5;return {x:r.left+(7+1.5*cell)*r.width/w,y:r.top+(7+2*cell)*r.height/w};})()");
  await cdp('Input.dispatchMouseEvent',{type:'mousePressed',x:edge.x,y:edge.y,button:'left',clickCount:1});
  await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:edge.x,y:edge.y,button:'left',clickCount:1});
  await until(()=>evaluate("!document.getElementById('undoBtn').classList.contains('disabled')"),'legal PvP move enables Undo',4000);
  await shot('game-after-legal-move');
  const settings=()=>evaluate("JSON.parse(localStorage.getItem('rombmaster.comfort.v1')||'{\"sound\":true,\"haptics\":true}')");
  assert.equal((await settings()).sound,true);
  const score=await evaluate("[document.getElementById('p1-score').textContent,document.getElementById('p2-score').textContent]");
  const haptics=(await settings()).haptics;
  await click('#game-sound-btn');
  assert.equal(await evaluate("document.getElementById('game-sound-btn').getAttribute('aria-pressed')"),'false');
  assert.equal((await settings()).sound,false);assert.equal((await settings()).haptics,haptics);
  assert.deepEqual(await evaluate("[document.getElementById('p1-score').textContent,document.getElementById('p2-score').textContent]"),score);
  await shot('game-sound-off');await click('#menuBtn');await shot('home-continue');await homeLayout();
  await cdp('Page.reload');await loaded();
  assert.equal(await evaluate("document.getElementById('sound-toggle').checked"),false);
  await click('#continueBtn');await sleep(400);
  assert.equal(await evaluate("document.getElementById('view-game').classList.contains('active-view')"),true);
  assert.doesNotMatch(await evaluate("document.getElementById('turn-label').textContent"),/paused/i);
  assert.equal(await evaluate("document.getElementById('undoBtn').classList.contains('disabled')"),false,'Played move must survive reload');
  assert.equal(await evaluate("document.getElementById('game-sound-btn').getAttribute('aria-pressed')"),'false');
  await click('#game-sound-btn');assert.equal((await settings()).sound,true);
 });
}catch(e){record('Browser QA execution','BLOCKED',e.stack||e.message);}
finally{
 if(errors.length)record('Application runtime / local assets','FAIL',errors.join('\n'));
 else if(results.length&&!results.some(r=>r.status==='BLOCKED'))record('Application runtime / local assets','PASS');
 if(ws)ws.close();
 if(browser)browser.kill();
 if(server){server.closeAllConnections();server.close();}
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify({commit,results,errors},null,2));
 if(temp)try{await fs.rm(temp,{recursive:true,force:true,maxRetries:3,retryDelay:200});}catch{}
 const pass=results.filter(r=>r.status==='PASS').length,failed=results.length-pass;
 console.log('PASS: '+pass+'; FAIL/BLOCKED: '+failed);
 console.log('REPORT: '+out);
 console.log('ROMBMASTER_VISUAL3_BROWSER: '+(failed?'FAIL':'PASS'));
 process.exitCode=failed?1:0;
}
