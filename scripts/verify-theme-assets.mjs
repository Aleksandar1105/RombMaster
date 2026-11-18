import {readFileSync} from 'node:fs';
import {resolve, dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const css=['style.css','skin-store-compact.css'].map(name=>readFileSync(join(root,'src',name),'utf8')).join('\n');
const references=[...new Set(Array.from(css.matchAll(/\/assets\/premium\/reference\/([a-z0-9-]+\.webp)/g),m=>'reference/'+m[1]))].sort();
// Include dynamically selected detail images from main.js as well as CSS URLs.
const master=[...new Set([
  ...Array.from(css.matchAll(/\/assets\/premium\/master\/([a-z0-9-]+\.(?:webp|svg))/g),m=>'master/'+m[1]),
  ...['neon','royal'].map(id=>'master/'+id+'-master-store.webp'),
])].sort();
const problems=[];
const targets=[];
if(process.argv.includes('--dist'))targets.push(['dist',join(root,'dist')]);
if(process.argv.includes('--android'))targets.push(['Android',join(root,'android/app/src/main/assets/public')]);
const hash=b=>createHash('sha256').update(b).digest('hex');
let referenceBytes=0,masterBytes=0;
if(references.length!==37)problems.push('Expected 37 reference assets; found '+references.length);
if(master.length<6)problems.push('Expected at least 6 Master assets; found '+master.length);
for(const name of [...references,...master]){
  try{
    const relative=join('assets','premium',name);
    const data=readFileSync(join(root,'src','public',relative));
    if(name.endsWith('.webp')){
      if(data.length<20||data.subarray(0,4).toString()!=='RIFF'||data.subarray(8,12).toString()!=='WEBP'||data.readUInt32LE(4)+8!==data.length)throw Error('Invalid WebP container');
    }else if(!/<svg[\s>]/.test(data.toString('utf8')))throw Error('Invalid SVG document');
    const isMaster=name.startsWith('master/');
    const budget=(isMaster?512:250)*1024;
    if(data.length>budget)throw Error('File exceeds '+budget+' byte budget');
    if(isMaster)masterBytes+=data.length;else referenceBytes+=data.length;
    for(const [label,target] of targets){
      const built=readFileSync(join(target,relative));
      if(hash(data)!==hash(built))throw Error(label+' output does not match source');
    }
  }catch(error){problems.push(name+': '+error.message);}
}
if(referenceBytes>4*1024*1024)problems.push('Reference assets exceed 4 MiB budget');
if(masterBytes>4*1024*1024)problems.push('Master assets exceed 4 MiB budget; review before expanding the catalog');
if(problems.length){
  console.error(problems.join('\n'));
  process.exitCode=1;
}else{
  console.log('ROMBMASTER_THEME_ASSETS: PASS ('+references.length+' reference + '+master.length+' Master, '+(referenceBytes+masterBytes)+' bytes'+(targets.length?', '+targets.map(t=>t[0]).join(' + ')+' SHA256 verified':'')+')');
}
