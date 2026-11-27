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
