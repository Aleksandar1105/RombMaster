import {readFileSync, statSync} from 'node:fs';
import {resolve, dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const css=readFileSync(join(root,'src','style.css'),'utf8');
const refs=[...new Set(Array.from(css.matchAll(/\/assets\/premium\/reference\/([a-z0-9-]+\.webp)/g),m=>m[1]))].sort();
const expected=37;
const problems=[];
const verifyDist=process.argv.includes('--dist');
const hash=b=>createHash('sha256').update(b).digest('hex');
let total=0;
if(refs.length!==expected)problems.push('Expected '+expected+' references; found '+refs.length);
for(const name of refs){
  try{
    const p=join(root,'src','public','assets','premium','reference',name);
    const data=readFileSync(p);
    if(data.length<20||data.subarray(0,4).toString()!=='RIFF'||data.subarray(8,12).toString()!=='WEBP'||data.readUInt32LE(4)+8!==data.length)throw Error('Invalid WebP container');
    if(data.length>250*1024)throw Error('File exceeds 250 KiB budget');
    total+=data.length;
    if(verifyDist){
      const built=readFileSync(join(root,'dist','assets','premium','reference',name));
      if(hash(data)!==hash(built))throw Error('Build output does not match source');
    }
  }catch(error){problems.push(name+': '+error.message);}
}
if(total>4*1024*1024)problems.push('Reference assets exceed 4 MiB budget');
if(problems.length){
  console.error(problems.join('\n'));
  process.exitCode=1;
}else{
  console.log('ROMBMASTER_THEME_ASSETS: PASS ('+refs.length+'/'+expected+', '+total+' bytes'+(verifyDist?', dist SHA256 verified':'')+')');
}
