import {readFileSync} from 'node:fs';
import {resolve, dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const css=['style.css','skin-store-compact.css'].map(name=>readFileSync(join(root,'src',name),'utf8')).join('\n');
const sources=css+'\n'+['index.html','main.js','skins.js'].map(name=>readFileSync(join(root,'src',name),'utf8')).join('\n');
const references=[...new Set(Array.from(sources.matchAll(/\/assets\/premium\/reference\/([a-z0-9-]+\.webp)/g),m=>'reference/'+m[1]))].sort();
const master=[...new Set([
  ...Array.from(sources.matchAll(/\/assets\/premium\/master\/([a-z0-9-]+\.(?:webp|svg))/g),m=>'master/'+m[1]),
  ...['neon','royal'].map(id=>'master/'+id+'-master-store.webp'),
])].sort();
// Legacy Career chapter/rival art is still used by CSS; include it in
// the same local and packaged-byte verification as the Master collection.
const legacy=[...new Set(Array.from(sources.matchAll(/\/assets\/premium\/((?:arenas|rivals)\/[a-z0-9-]+\.webp)/g),m=>m[1]))].sort();
const problems=[], targets=[];
if(process.argv.includes('--dist'))targets.push(['dist',join(root,'dist')]);
if(process.argv.includes('--android'))targets.push(['Android',join(root,'android/app/src/main/assets/public')]);
const hash=b=>createHash('sha256').update(b).digest('hex');
const KiB=1024,MiB=1024*1024;
// Separate bounded budgets reflect the expanded 16-skin collection.
// No unbounded growth: report actual totals and fail on missing/oversized art.
const limits={reference:[250*KiB,4*MiB],portrait:[256*KiB,6*MiB],arena:[512*KiB,8*MiB],button:[256*KiB,4*MiB],victory:[512*KiB,8*MiB],other:[512*KiB,5*MiB]};
limits.legacy=[512*KiB,6*MiB];
const bytes=Object.fromEntries(Object.keys(limits).map(k=>[k,0]));
const category=name=>name.startsWith('arenas/')||name.startsWith('rivals/')?'legacy':name.startsWith('reference/')?'reference':/\/(?:avatar|rival)-/.test(name)?'portrait':/-master-arena\.webp$/.test(name)?'arena':/-master-button-clean\.webp$/.test(name)?'button':/-master-victory\.webp$/.test(name)?'victory':'other';
const skins=['neon','royal','cyber','ice','wood','white','autumn-kingdom','frozen-christmas','golden-dragon','spring-blossom','summer-paradise','halloween-curse','midnight-gold','obsidian-neon','celestial-void','synthwave-sunset'];
const expected=[...skins.flatMap(id=>['arena','button-clean','victory'].map(kind=>'master/'+id+'-master-'+kind+'.webp'))];
const avatars=['spark','fox','robot','rocket','dragon','shield','neon-fox','azure-squire','jade-huntress','crimson-sentinel','frost-oracle','onyx-warden','crown-ascendant','circuit-valkyrie','storm-raptor','ember-ronin','moon-weaver','coral-corsair','prism-golem','solar-sovereign','void-monarch','celestial-empress','dragon-emperor','aurora-seraph','chronos-architect'];
const rivals=['rookie','trickster','predator','phantom','grandmaster','omega'];
expected.push(...avatars.map(id=>'master/avatar-'+id+'-master.webp'),...rivals.map(id=>'master/rival-'+id+'-master.webp'),...['blitz','infinity','perfect','puzzle','survival'].map(id=>'master/arena-'+id+'.webp'));
for(const name of expected)if(!master.includes(name))problems.push('Expected asset is not referenced: '+name);
if(references.length!==37)problems.push('Expected 37 reference assets; found '+references.length);
const legacyIds=['first-steps','neon-city','crystal-world','ancient-kingdom','cyber-arena','master-realm'].map(id=>'arenas/'+id+'.webp').concat(rivals.map(id=>'rivals/'+id+'.webp'));
for(const name of legacyIds)if(!legacy.includes(name))problems.push('Expected legacy asset is not referenced: '+name);
for(const id of skins.filter(id=>!['neon','royal','obsidian-neon','celestial-void','synthwave-sunset'].includes(id))){
 const hero='reference/'+id+'-reference-hero.webp';
 if(!references.includes(hero))problems.push('Dynamic store hero is not referenced: '+hero);
}
for(const name of [...references,...master,...legacy]){
  try{
    const relative=join('assets','premium',name), data=readFileSync(join(root,'src','public',relative));
    if(name.endsWith('.webp')){
      if(data.length<20||data.subarray(0,4).toString()!=='RIFF'||data.subarray(8,12).toString()!=='WEBP'||data.readUInt32LE(4)+8!==data.length)throw Error('Invalid WebP container');
    }else if(!/<svg[\s>]/.test(data.toString('utf8')))throw Error('Invalid SVG document');
    const group=category(name), budget=limits[group][0];
    if(data.length>budget)throw Error('File exceeds '+budget+' byte '+group+' budget');
    bytes[group]+=data.length;
    for(const [label,target] of targets){
      const built=readFileSync(join(target,relative));
      if(hash(data)!==hash(built))throw Error(label+' output does not match source');
    }
  }catch(error){problems.push(name+': '+error.message);}
}
for(const [group,total] of Object.entries(bytes))if(total>limits[group][1])problems.push(group+' exceeds '+limits[group][1]+' byte budget: '+total);
const masterBytes=Object.entries(bytes).filter(([k])=>k!=='reference'&&k!=='legacy').reduce((sum,[,n])=>sum+n,0);
if(masterBytes>24*MiB)problems.push('Master assets exceed 24 MiB overall budget');
console.log('Asset bytes: '+JSON.stringify(bytes)+'; Master total '+masterBytes);
if(problems.length){console.error(problems.join('\n'));process.exitCode=1;}
else console.log('ROMBMASTER_THEME_ASSETS: PASS ('+references.length+' reference + '+master.length+' Master + '+legacy.length+' Career, '+(bytes.reference+masterBytes+bytes.legacy)+' bytes'+(targets.length?', '+targets.map(t=>t[0]).join(' + ')+' SHA256 verified':'')+')');
