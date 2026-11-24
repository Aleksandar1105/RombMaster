const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const js=read('src/neon-home-press.js');
const css=read('src/neon-p1-press.css');

async function harness({edition='core',skin='neon',reduced=false}={}) {
 const events=new Map(),present=new Set(),button={
   hidden:false, disabled:false, offsetWidth:114,
   classList:{add(x){present.add(x);},remove(x){present.delete(x);},contains(x){return present.has(x);}},
   getAttribute(){return null;}
 };
 const doc={
   documentElement:{dataset:{edition,skin}}, defaultView:{matchMedia:()=>({matches:reduced})},
   getElementById:()=>({hidden:false}),
   querySelectorAll:()=>present.has('rm-home-press')?[button]:[],
   addEventListener(name,handler){events.set(name,handler);}
 };
 const module=new vm.SourceTextModule(js,{context:vm.createContext({})});
 await module.link(()=>{throw new Error('No imports expected');});
 await module.evaluate();
 const {mountNeonHomePress,clearNeonHomePress}=module.namespace;
 mountNeonHomePress(doc);
 const target={closest:()=>button};
 return {events,button,doc,target,present,clearNeonHomePress};
}

test('P1.6 pointerdown begins the sweep before click; animationend clears it',async()=>{
 const h=await harness();
 h.events.get('pointerdown')({target:h.target,isPrimary:true,button:0});
 assert.equal(h.present.has('rm-home-press'),true);
 h.events.get('animationend')({animationName:'rm-home-press-depth',target:h.button});
 assert.equal(h.present.has('rm-home-press'),false);
 h.events.get('pointerdown')({target:h.target,isPrimary:true,button:0});
 h.clearNeonHomePress(h.doc);
 assert.equal(h.present.has('rm-home-press'),false);
});

test('P1.6 skips disabled, non-primary, right taps and other skins',async()=>{
 const h=await harness();
 h.button.disabled=true;
 h.events.get('pointerdown')({target:h.target,isPrimary:true,button:0});
 assert.equal(h.present.size,0);
 h.button.disabled=false;
 h.events.get('pointerdown')({target:h.target,isPrimary:false,button:0});
 h.events.get('pointerdown')({target:h.target,isPrimary:true,button:2});
 assert.equal(h.present.size,0);
 const other=await harness({edition:'full'});
 other.events.get('pointerdown')({target:other.target,isPrimary:true,button:0});
 assert.equal(other.present.size,0);
});

test('P1.6 supports keyboard and assistive clicks, with reduced motion',async()=>{
 const h=await harness();
 h.events.get('keydown')({target:h.target,key:'Enter',repeat:false});
 assert.equal(h.present.has('rm-home-press'),true);
 h.events.get('animationcancel')({animationName:'rm-home-press-depth',target:h.button});
 assert.equal(h.present.has('rm-home-press'),false);
 h.events.get('click')({target:h.target,detail:0});
 assert.equal(h.present.has('rm-home-press'),true);
 const reduced=await harness({reduced:true});
 reduced.events.get('pointerdown')({target:reduced.target,isPrimary:true,button:0});
 assert.equal(reduced.present.size,0);
});

test('P1.6 CSS is nonblocking, motion-safe and keeps existing sound/haptics',()=>{
 const main=read('src/main.js');
 assert.match(main,/import '\.\/neon-p1-material\.css';\s*import '\.\/neon-p1-press\.css';/);
 assert.match(main,/mountNeonHomePress\(document\)/);
 assert.match(main,/clearNeonHomePress\(document\)/);
 assert.match(css,/@layer neonControls/);
 assert.match(css,/#home-hub\[data-home-revision="3"\]\[data-layout="premium"\]\[data-neon-reference="1"\]:not\(\[hidden\]\)/);
 assert.match(css,/animation:rm-home-press-depth 230ms/);
 assert.match(css,/animation:rm-home-press-sweep 230ms/);
 assert.match(css,/pointer-events:none !important/);
 assert.match(css,/@media \(prefers-reduced-motion:reduce\)/);
 assert.doesNotMatch(css,/grid-template|grid-column|grid-row|position:fixed|(?:^|\s)(?:width|height|font-size)\s*:\s*\d/);
 assert.doesNotMatch(js,/Native\.vibrate|playButtonSound|setTimeout/);
 assert.match(main,/Native\.vibrate\('light'\);\s*Game\.playButtonSound\(\)/);
});