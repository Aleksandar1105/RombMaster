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
 for(const id of ['home-skin-store','home-arcade','startBtn','daily-open-btn','helpBtn'])
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
// Real DOM geometry, including clipping by scroll containers and hit testing.
function inspectControls(scope, selectors, requireFit=true) {
 const root=document.querySelector(scope), failures=[];
 if(!root)return {failures:['Missing scope '+scope]};
 const bounds=root.getBoundingClientRect();
 for(const selector of selectors) {
  const elements=[...root.querySelectorAll(selector)];
  if(!elements.length){failures.push('Missing '+selector);continue;}
  for(const e of elements){
   const r=e.getBoundingClientRect(),name=e.id||e.getAttribute('aria-label')||e.textContent.trim()||selector;
   if(e.closest('[hidden]')||!r.width||!r.height){failures.push(name+': hidden');continue;}
   if(r.width<43||r.height<43||r.left<Math.max(0,bounds.left)-1||r.top<Math.max(0,bounds.top)-1||
    r.right>Math.min(innerWidth,bounds.right)+1||r.bottom>Math.min(innerHeight,bounds.bottom)+1)
     failures.push(name+': too small or outside viewport '+JSON.stringify(r.toJSON()));
   if(!e.disabled&&!e.closest('[inert]')){
    const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
    if(hit!==e&&!e.contains(hit))failures.push(name+': obscured by '+(hit?.id||hit?.tagName));
   }
  }
 }
 if(requireFit&&root.scrollHeight>root.clientHeight+2)failures.push('Vertical overflow '+root.scrollHeight+'/'+root.clientHeight);
 if(root.scrollWidth>root.clientWidth+2)failures.push('Horizontal overflow '+root.scrollWidth+'/'+root.clientWidth);
 return {failures,width:innerWidth,height:innerHeight,scrollTop:root.scrollTop,scope};
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
 // Initialize through the genuine first-run form in this disposable browser profile.
 await check('Career first-run identity',async()=>{
  await click('[data-page="career-page"]');
  assert.equal(await evaluate("document.getElementById('career-identity').hidden"),false);
  await evaluate("document.getElementById('career-name').value='QA Player'");
  await click('#career-identity button[type=submit]');
  assert.equal(await evaluate("document.getElementById('career-identity').hidden"),true);
  await click('#page-back');await click('#page-back');
 });
 for(const [w,h] of [[320,568],[360,640],[412,860],[480,900],[844,390]]){
  await viewport(w,h);await shot('home-neon-'+w+'x'+h);await check('Home '+w+'x'+h,homeLayout);
 }
 const sizes=[[320,568],[360,640],[412,860],[480,900],[844,390]];
 const controls=async(scope,selectors,fit=true)=>{
  const d=await evaluate('('+inspectControls.toString()+')('+JSON.stringify(scope)+','+JSON.stringify(selectors)+','+fit+')');
  assert.equal(d.failures.length,0,JSON.stringify(d));assert.equal(d.scrollTop,0,JSON.stringify(d));
  return d.width+'x'+d.height+' '+d.scope;
 };
 // Exercise actual navigation, not just CSS visibility. No scrollIntoView for primary actions.
 for(const [w,h] of sizes){
  await viewport(w,h);
  for(const [page,name,selectors] of [
   ['career-page','Career',['#page-back','#previous-chapter','#next-chapter','#chapter-route button','#career-open-mission','#career-screen-next']],
   ['quick-settings','Quick Play',['#page-back','[data-size]','[data-ai]','[data-diff]','#setup-play']],
   ['player-settings','Profile Players',['#page-back','.profile-switcher label','#local-player-select','#profile-create-toggle','#profile-name','#save-profile-btn']],
   ['comfort-settings','Settings',['#page-back','.comfort-toggle']]
  ]){
   await check(name+' '+w+'x'+h,async()=>{
    try{
     await click('[data-page="'+page+'"]');
     if(page==='quick-settings')await click('[data-ai="ai"]');
     if(page==='player-settings')await click('label:has(#profile-section-players)');
     await shot('v21-'+page+'-'+w+'x'+h);
     return await controls('#view-menu',selectors);
    }finally{
     if(await evaluate("!document.getElementById('menu-page').hidden"))await click('#page-back',true);
    }
   });
  }
  await check('Career mission and rivals '+w+'x'+h,async()=>{
   try{
    await click('[data-page="career-page"]');await click('#career-open-mission');
    await controls('#view-menu',['#page-back','#career-start-btn','#career-screen-prev','#career-screen-next']);
    await click('#career-screen-next');await shot('v254-rivals-'+w+'x'+h);
    const rivals=await evaluate("Array.from(document.querySelectorAll('[data-career-screen=rivals] img')).map(i=>({ok:i.complete&&i.naturalWidth>0,src:i.getAttribute('src'),width:i.getBoundingClientRect().width}))");
    assert.equal(rivals.length,6);assert.ok(rivals.every(i=>i.ok&&i.src.includes('/master/rival-')&&i.width>0),JSON.stringify(rivals));
    await controls('#view-menu',['#page-back','#career-screen-prev','#career-screen-next']);
    await click('#page-back');assert.equal(await evaluate("document.querySelector('[data-career-screen=mission]').hidden"),false);
    await click('#page-back');assert.equal(await evaluate("document.querySelector('[data-career-screen=levels]').hidden"),false);
   }finally{
    for(let n=0;n<3&&await evaluate("!document.getElementById('menu-page').hidden");n++)await click('#page-back',true);
   }
  });
  await check('Profile Characters '+w+'x'+h,async()=>{
   try{
    await click('[data-page="player-settings"]');await click('label:has(#profile-section-avatar)');
    assert.equal(await evaluate("getComputedStyle(document.querySelector('[data-profile-pane=players]')).display"),'none');
    assert.equal(await evaluate("getComputedStyle(document.querySelector('[data-profile-pane=stats]')).display"),'none');
    await shot('v21-avatars-'+w+'x'+h);
    const seen=new Set();
    for(let page=0;page<25;page++){
     const cards=await evaluate("Array.from(document.querySelectorAll('.avatar-choice:not([hidden])')).map(e=>({id:e.dataset.profileAvatar,art:getComputedStyle(e.querySelector('.avatar-art')).backgroundImage,status:e.querySelector('[data-avatar-lock]').textContent}))");
     assert.ok(cards.length>0&&cards.every(c=>c.art.includes('avatar-'+c.id+'-master.webp')&&c.status),JSON.stringify(cards));
     for(const c of cards){assert.ok(!seen.has(c.id),'Duplicate page ID '+c.id);seen.add(c.id);}
     await controls('#view-menu',['#page-back','.profile-switcher label','#character-filter','.avatar-choice:not([hidden])','#profile-avatar-prev','#profile-avatar-next']);
     if(await evaluate("document.getElementById('profile-avatar-next').disabled"))break;
     await click('#profile-avatar-next');
    }
    assert.equal(seen.size,25);
    await evaluate("(()=>{const e=document.getElementById('character-filter');e.value='legendary';e.dispatchEvent(new Event('change'));return true;})()");
    assert.equal(await evaluate("document.getElementById('character-count').textContent"),'6 / 25');
    assert.ok(await evaluate("Array.from(document.querySelectorAll('.avatar-choice:not([hidden])')).every(e=>e.disabled&&e.dataset.entitlement==='preview')"));
    return '25 unique character cards across pages; Legendary preview-only';
   }finally{
    if(await evaluate("!document.getElementById('menu-page').hidden")){
     await click('label:has(#profile-section-players)',true);await click('#page-back',true);
    }
   }
  });
 }
 await viewport(412,860);
 await check('Profile statistics and reset remain accessible',async()=>{
  try{
   await click('[data-page="player-settings"]');await click('label:has(#profile-section-stats)');
   assert.equal(await evaluate("getComputedStyle(document.querySelector('[data-profile-pane=stats]')).display"),'flex');
   assert.equal(await evaluate("document.querySelectorAll('#achievement-list li').length"),24);
   await shot('v21-profile-statistics');
   // Verify reset is reachable, but never activate a destructive action.
   await evaluate("document.getElementById('reset-career-btn').scrollIntoView({block:'center'})");
   const d=await evaluate('('+inspectControls.toString()+')("#view-menu",["#reset-career-btn"],false)');
   assert.equal(d.failures.length,0,JSON.stringify(d));
  }finally{
   if(await evaluate("!document.getElementById('menu-page').hidden")){
    await click('label:has(#profile-section-players)',true);await click('#page-back',true);
   }
  }
 });
 await viewport(412,860);
 // The catalog uses actual local artwork in a separate region, not behind text.
 const checkCatalogArt=async()=>{
  const items=await evaluate(`(async()=>{
   const cards=[...document.querySelectorAll('#skin-options .skin-card')];
   return Promise.all(cards.map(async card=>{
    const id=card.dataset.skinId,art=getComputedStyle(card,'::before'),bounds=card.getBoundingClientRect();
    const name=card.querySelector('.skin-card-name'),status=card.querySelector('.skin-card-status'),rarity=card.querySelector('.skin-card-rarity'),action=card.querySelector('.skin-card-action');
    const src=['neon','royal'].includes(id)?'/assets/premium/master/'+id+'-master-store.webp':'/assets/premium/reference/'+id+'-reference-hero.webp';
    const img=new Image();img.src=src;let decoded=true;try{await img.decode();}catch{decoded=false;}
    const inside=[name,status,rarity].every(el=>{const b=el.getBoundingClientRect();return b.width>0&&b.height>0&&b.left>=bounds.left-1&&b.right<=bounds.right+1&&b.top>=bounds.top-1&&b.bottom<=bounds.bottom+1;});
    return {id,decoded,art:art.backgroundImage.includes(src)&&art.content!=='none'&&art.display!=='none',inside,overflow:card.scrollWidth>card.clientWidth+2,action:action.textContent.trim()};
   }));
  })()`);
  assert.ok(items.length>0);
  for(const item of items)assert.ok(item.decoded&&item.art&&item.inside&&!item.overflow&&item.action,JSON.stringify(item));
  return items.length+' cards: decoded local hero, bounded metadata and action';
 };
 await check('Skins opens My Collection',async()=>{
  await click('#home-skin-store');
  assert.equal(await evaluate("document.getElementById('page-title').textContent"),'My Collection');
  assert.equal(await evaluate("document.getElementById('skin-tab-collection').getAttribute('aria-pressed')"),'true');
  await check('Collection artwork and card metadata',checkCatalogArt);
  await shot('my-collection');await click('#page-back',true);
 });
 await check('Skin Store opens six base skins',async()=>{
  await click('#home-skin-store');await click('#skin-tab-store',true);
  assert.equal(await evaluate("document.getElementById('page-title').textContent"),'Skin Store');
  assert.equal(await evaluate("document.querySelectorAll('#skin-options .skin-card').length"),6);
  await shot('skin-store');
 });
 const resultThemes=new Map(); // local fixtures only, never equip locked skins
 const storageSkin=()=>evaluate("JSON.stringify(Object.keys(localStorage).filter(k=>k.includes('rombmaster_skin_v1')).sort().map(k=>[k,localStorage.getItem(k)]))");
 const priorSkin=await evaluate("document.documentElement.dataset.skin"),priorPrefs=await storageSkin();
 for(const [tab,ids] of [
 ['#skin-tab-store',['neon','royal','cyber','ice','wood','white']],
 ['#skin-tab-seasonal',['frozen-christmas','golden-dragon','spring-blossom','summer-paradise','autumn-kingdom','halloween-curse','midnight-gold']]
 ]){
  await click(tab,true);
  await check('Catalog '+tab,async()=>assert.equal(await evaluate("document.querySelectorAll('#skin-options .skin-card').length"),Math.min(6,ids.length)));
  await check('Catalog artwork and metadata '+tab,checkCatalogArt);
  if(tab==='#skin-tab-seasonal')await shot('v24-seasonal-store');
  for(const id of ids)await check('Home preview '+id,async()=>{
   try{
    if(!await evaluate("!!document.querySelector('[data-skin-id=\""+id+"\"]')"))await click('#skin-page-next',true);
    await click('[data-skin-id="'+id+'"]',true);
    assert.equal(await evaluate("document.getElementById('skin-catalog-panel').hidden && !document.getElementById('skin-detail-panel').hidden"),true);
    const theme=await evaluate("(()=>{const e=document.getElementById('skin-stage');return Object.fromEntries(['--skin-bg','--skin-x','--skin-o','--skin-accent','--skin-ink','--skin-panel','--skin-gold'].map(k=>[k,e.style.getPropertyValue(k)]));})()");
    assert.ok(Object.values(theme).every(Boolean),'Missing theme variables: '+id);
    resultThemes.set(id,theme);
    await check('Capture material '+id,async()=>{
     const d=await evaluate(`(()=>{const c=document.getElementById('skin-preview'),stage=document.getElementById('skin-stage');
       const p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
       const cell=(c.width-16)/5, sample=(r,col)=>{const x=Math.floor(8+(col+.3)*cell),y=Math.floor(8+(r+.3)*cell);return Array.from(p.slice((y*c.width+x)*4,(y*c.width+x)*4+3));};
       return {skin:stage.dataset.previewSkin,width:c.width,height:c.height,x:sample(2,2),o:sample(1,2),o2:sample(2,3),png:c.toDataURL('image/png')};})()`);
     assert.equal(d.skin,id);assert.ok(d.width>=120&&d.height>=120);
     assert.notDeepEqual(d.x,d.o,'Opposite captured cells have identical sample colors');
     assert.notDeepEqual(d.x,d.o2,'Horizontal opposing cells have identical sample colors');
     assert.ok(d.png.startsWith('data:image/png;base64,'));
     await fs.writeFile(path.join(out,'v23-board-'+id+'.png'),Buffer.from(d.png.split(',')[1],'base64'));
     return d.width+'x'+d.height+' renderer fixture, opposing captures';
    });
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
      const skinId=${JSON.stringify(id)};
      const name=skinId==='royal'?'royal-master-hero.webp':skinId+'-reference-hero.webp';
      const folder=skinId==='royal'?'master':'reference';
      const hero=document.getElementById('premium-hero-stage');
      const background=getComputedStyle(hero).backgroundImage;
      const urls=Array.from(background.matchAll(/url\\(["']?([^"')]+)["']?\\)/g),m=>m[1]);
      const first=urls[0]||'';
      if(!first.endsWith('/assets/premium/'+folder+'/'+name))return {ok:false,background,name};
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
    if(await evaluate("!document.getElementById('skin-detail-panel').hidden"))await click('#page-back',true);
   }
  });
 }
 await check('Three Prestige skins remain preview-only',async()=>{
  await click('#skin-tab-prestige',true);
  for(const id of ['obsidian-neon','celestial-void','synthwave-sunset']){
   await click('[data-skin-id="'+id+'"]',true);
   assert.ok(await evaluate("document.getElementById('skin-equip').disabled&&document.getElementById('skin-home-preview').disabled"));
   await shot('prestige-'+id);await click('#page-back',true);
  }
 });
 await check('Locked seasonal skin cannot be equipped',async()=>{
  await click('#skin-tab-seasonal',true);
  if(!await evaluate("!!document.querySelector('[data-skin-id=halloween-curse]')"))await click('#skin-page-next',true);
  await click('[data-skin-id="halloween-curse"]',true);
  assert.equal(await evaluate("document.getElementById('skin-equip').disabled"),true);
  await click('#page-back',true);
  await click('#page-back',true);
 });
 await check('In-match sound toggle and persistence',async()=>{
  // Select a deterministic local PvP board; no AI racing the sound check.
  await click('[data-page="quick-settings"]');
  await click('[data-size="4"]',true);
  await click('[data-ai="pvp"]',true);
  await cdp('Page.bringToFront');
  await click('#setup-play',true);
  await until(()=>evaluate("document.getElementById('view-game').classList.contains('active-view')"),'quick match');
  await sleep(400);await shot('game-sound-on');
  const controlGlyphs=async()=>{
   const data=await evaluate(`(()=>['undoBtn','restartBtn','game-sound-btn','menuBtn'].map(id=>{
    const e=document.getElementById(id),icon=e.querySelector('svg'),label=e.querySelector('span'),r=e.getBoundingClientRect(),a=getComputedStyle(icon),b=getComputedStyle(label);
    return {id,width:r.width,height:r.height,iconOpacity:Number(a.opacity),labelOpacity:Number(b.opacity),iconVisible:a.display!=='none'&&a.visibility==='visible'&&icon.getBoundingClientRect().width>0,labelVisible:b.display!=='none'&&b.visibility==='visible'&&label.getBoundingClientRect().width>0&&!!label.textContent.trim(),stroke:a.stroke,color:b.color};
   }))()`);
   for(const item of data){
    assert.ok(item.width>=43&&item.height>=43&&item.iconVisible&&item.labelVisible&&item.iconOpacity>=.9&&item.labelOpacity>=.9,JSON.stringify(item));
    assert.ok(!['none','transparent','rgba(0, 0, 0, 0)'].includes(item.stroke)&&!['transparent','rgba(0, 0, 0, 0)'].includes(item.color),JSON.stringify(item));
   }
  };
  await check('Gameplay control glyphs with disabled Undo',controlGlyphs);

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
  await check('Gameplay control glyphs with enabled Undo',controlGlyphs);
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
 // Continue the real saved small PvP match from the preceding browser test.
 // Its first move was h(2,1); the next four set up an actual two-cell capture.
 await check('Live PvP double capture, extra turn, Undo and reload',async()=>{
  const state=()=>evaluate("(()=>{const e=id=>document.getElementById(id);return {active:e('view-game').classList.contains('active-view'),scores:[Number(e('p1-score').textContent),Number(e('p2-score').textContent)],turn:e('turn-status').dataset.player,label:e('turn-label').textContent,comboHidden:e('capture-combo').hidden,combo:e('capture-combo').textContent,owner:e('capture-combo').dataset.owner};})()");
  const tapEdge=async(t,row,col)=>{
   const pos=await evaluate(`(()=>{const c=document.getElementById('canvas'),r=c.getBoundingClientRect(),w=parseFloat(c.style.width),cell=(w-14)/5,t=${JSON.stringify(t)},row=${row},col=${col};
    const x=r.left+(7+(col+(t==='h'?.5:0))*cell)*r.width/w;
    const y=r.top+(7+(row+(t==='v'?.5:0))*cell)*r.height/w;
    return {x,y,hit:document.elementFromPoint(x,y)===c};})()`);
   assert.ok(pos.hit,'Target edge is obscured: '+JSON.stringify([t,row,col]));
   await cdp('Input.dispatchMouseEvent',{type:'mousePressed',x:pos.x,y:pos.y,button:'left',clickCount:1});
   await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:pos.x,y:pos.y,button:'left',clickCount:1});
   await sleep(100);
  };
  let d=await state();
  assert.ok(d.active);assert.deepEqual(d.scores,[0,0]);assert.equal(d.turn,'two');
  for(const [t,row,col,next] of [['h',3,1,'one'],['h',2,2,'two'],['h',3,2,'one'],['v',2,3,'two']]){
   await tapEdge(t,row,col);d=await state();assert.deepEqual(d.scores,[0,0]);assert.equal(d.turn,next);
  }
  await tapEdge('v',2,2);
  d=await state();assert.deepEqual(d.scores,[0,2]);assert.equal(d.turn,'two');
  assert.match(d.label,/another turn/i);assert.equal(d.comboHidden,false);
  assert.match(d.combo,/Double Capture.*2 cells/);assert.equal(d.owner,'0');
  await shot('v23-live-double-capture');
  await click('#undoBtn');d=await state();
  assert.deepEqual(d.scores,[0,0]);assert.equal(d.turn,'two');
  assert.equal(d.comboHidden,true);assert.equal(d.combo,'');
  assert.doesNotMatch(d.label,/another turn/i);
  await shot('v23-live-double-capture-undo');
  await tapEdge('v',2,2);d=await state();
  assert.deepEqual(d.scores,[0,2]);assert.equal(d.turn,'two');
  assert.equal(d.comboHidden,false);
  await click('#menuBtn');
  await cdp('Page.reload');await loaded();await click('#continueBtn');await sleep(400);
  d=await state();assert.ok(d.active);assert.deepEqual(d.scores,[0,2]);assert.equal(d.turn,'two');
  assert.equal(d.comboHidden,true);
  await click('#undoBtn');d=await state();
  assert.deepEqual(d.scores,[0,0]);assert.equal(d.turn,'two');assert.equal(d.comboHidden,true);
  return 'Two real captures, retained turn, Undo, recapture, persisted score and Undo';
 });
 // Outcome layout fixtures use the actual packaged DOM and styles. They do not
 // simulate legal wins or write Career progress. Existing unit tests cover result logic.
 await cdp('Page.reload');await loaded();
 assert.equal(resultThemes.size,13,'Expected all thirteen theme palettes');
 const resultCases=[...sizes.map(([w,h])=>({w,h,id:'neon'})),...[...resultThemes.keys()].filter(id=>id!=='neon').map(id=>({w:412,h:860,id}))];
 for(const {w,h,id} of resultCases){
  await viewport(w,h);
  await evaluate(`(()=>{const root=document.documentElement;root.dataset.skin=${JSON.stringify(id)};for(const [k,v] of Object.entries(${JSON.stringify(resultThemes.get(id))}))root.style.setProperty(k,v);return true;})()`);
  for(const outcome of ['victory','defeat','draw']){
   await check('Result fixture '+(id==='neon'?'':id+' ')+outcome+' '+w+'x'+h,async()=>{
    try{
     await evaluate(`(()=>{const e=id=>document.getElementById(id),o=${JSON.stringify(outcome)},win=o==='victory';
      const overlay=e('overlay');overlay.dataset.outcome=o;overlay.dataset.resultPage='overview';
      e('result-title').textContent=win?'Victory!':o==='defeat'?'Game Over':'Draw';
      e('result-score').textContent=win?'16 - 5':o==='defeat'?'5 - 16':'10 - 10';
      e('result-stars').hidden=!win;e('result-stars').textContent=win?'★★★':'';
      e('result-stars').style.setProperty('--stars','3');
      e('career-reward').hidden=false;e('career-reward').textContent=win?'+100 XP\\nAchievement unlocked: Long chain, First win, Master tactician':'Career level 12: Try again';
      e('nextCareerBtn').hidden=!win;e('nextCareerBtn').textContent='Play level 13';
      e('next-level-label').textContent='Up next · Level 13';e('next-career-title').textContent='Control the board';
      e('next-clue').textContent='Look ahead before opening a new chain.';
      e('match-analysis').hidden=false;e('match-analysis').textContent='Match analysis · 17 moves · 16 cells · 3 double captures · Best chain 6 · Immediate concessions 2';
      overlay.classList.add('flex');overlay.scrollTop=0;overlay.querySelector('.result-details').scrollTop=0;
      return true;})()`);
     await shot((id==='neon'?'v21-result-':'v23-result-'+id+'-')+outcome+'-'+w+'x'+h);
     if(outcome!=='victory'){
      const badge=await evaluate("(()=>{const c=getComputedStyle(document.getElementById('result-title'),'::before');return {content:c.content,display:c.display,width:parseFloat(c.width)};})()");
      assert.ok(badge.content!=='none'&&badge.display!=='none'&&badge.width>=30,JSON.stringify(badge));
     }
     assert.equal(await evaluate("getComputedStyle(document.querySelector('#overlay .up-next')).display"),'none');
     assert.equal(await evaluate("getComputedStyle(document.getElementById('overlay')).overflowY"),'hidden');
     const selectors=['#againBtn','#backMenuBtn',...(outcome==='victory'?['#nextCareerBtn']:[])];
     const details=await controls('#overlay',selectors);
     // Even when optional details overflow, the actual action rectangles must not move.
     const before=await evaluate("document.querySelector('#overlay .result-actions').getBoundingClientRect().top");
     await evaluate("(()=>{const p=document.querySelector('#overlay .result-details');p.scrollTop=p.scrollHeight;return true;})()");
     assert.equal(await evaluate("document.querySelector('#overlay .result-actions').getBoundingClientRect().top"),before);
     await controls('#overlay',selectors);
     return details;
    }finally{await evaluate("document.getElementById('overlay').classList.remove('flex')");}
   });
  }
 }
 await cdp('Page.reload');await loaded();
 await viewport(412,860);
 await check('Static preview canvases accept swipe; gameplay canvas retains touch input',async()=>{
  try{
   await click('#home-skin-store');
   await click('#skin-tab-store',true);
   const d=await evaluate("(()=>{const p=document.getElementById('skin-preview'),g=document.getElementById('canvas');return {cards:document.querySelectorAll('#skin-options .skin-card').length,canvases:document.querySelectorAll('#skin-options canvas').length,detailHidden:document.getElementById('skin-detail-panel').hidden,preview:getComputedStyle(p).pointerEvents,game:getComputedStyle(g).touchAction};})()");
   assert.deepEqual(d,{cards:6,canvases:0,detailHidden:true,preview:'none',game:'none'});
   // Native touch scrolling is additionally checked on physical Android.
   await shot('v21-static-store-preview');
  }finally{if(await evaluate("!document.getElementById('menu-page').hidden"))await click('#page-back',true);}
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
