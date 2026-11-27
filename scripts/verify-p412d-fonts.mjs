import {readFileSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const rel='assets/fonts/rombm';
const source=join(root,'src/public',rel);
const raw=readFileSync(join(source,'manifest.json'));
const manifest=JSON.parse(raw);
assert.equal(manifest.sourceCommit,'5026800714d07231937d92eb4cceabf06e05d74e');
const names=['exo-2.woff2','manrope.woff2','exo-2-OFL.txt','manrope-OFL.txt'].sort();
assert.deepEqual(Object.keys(manifest.files).sort(),names);
const pinned={
 'exo-2.woff2':{bytes:106100,sha256:'95be8c9c7692008c2001180a0d29d0b86b888d35bf932a56293447497f3585ed'},
 'manrope.woff2':{bytes:53892,sha256:'30b83738add8c9edd9e3450b98036a9a8fb5668d0cbd4eb0ce5fe6761197f21f'},
 'exo-2-OFL.txt':{bytes:4386,sha256:'7f95a8eeecc6904ffc81cd10cc8ebc7fcee72a67922924bf45f02dff03b88127'},
 'manrope-OFL.txt':{bytes:4387,sha256:'58172e0c0fac2cda8a37b348164bb55e44b0e69051e557e92b1d3f6910141f7b'}
};
assert.deepEqual(manifest.files,pinned);
const hash=b=>createHash('sha256').update(b).digest('hex');
const targets=[];
if(process.argv.includes('--dist'))targets.push(join(root,'dist',rel));
if(process.argv.includes('--android'))targets.push(join(root,'android/app/src/main/assets/public',rel));
for(const name of names){
 const data=readFileSync(join(source,name));
 assert.equal(data.length,manifest.files[name].bytes,name);
 assert.equal(hash(data),manifest.files[name].sha256,name);
 if(name.endsWith('.woff2')){
  assert.equal(data.toString('ascii',0,4),'wOF2',name);
  assert.equal(data.readUInt32BE(8),data.length,name);
  assert.ok(data.length<=350*1024,name);
 }else assert.ok(data.includes('SIL OPEN FONT LICENSE'),name);
 for(const target of targets)assert.equal(hash(readFileSync(join(target,name))),hash(data),name);
}
for(const target of targets)assert.equal(hash(readFileSync(join(target,'manifest.json'))),hash(raw));
console.log('ROMBMASTER_FONTS: PASS ('+names.length+' files, '+targets.length+' packaged targets)');
