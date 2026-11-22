const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync(require('node:path').join(__dirname,'../src/neon-screens.css'),'utf8');
test('Neon background trial only targets visible premium Home, not Quick Play',()=>{
 const trial=css.split('/* NEON HOME BACKGROUND TRIAL')[1];
 assert.ok(trial,'trial selector present');
 assert.match(trial,/#home-hub\[data-home-revision="3"\]\[data-layout="premium"\]\[data-neon-reference="1"\]:not\(\[hidden\]\)/);
 assert.match(trial,/f665960e-8e08-4a8d-ba93-e1656759a836\.png/);
 assert.doesNotMatch(trial,/#[\w-]*(?:quick-settings|view-game|overlay|career-page|menu-page)/);
});
