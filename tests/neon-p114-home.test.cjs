const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname,'../src',name),'utf8');
const css = read('neon-p114-home.css');
test('P1.14 retains compact-height safeguard and isolates portrait growth to visible Core Neon Home', () => {
  assert.match(css, /@media \(orientation:portrait\) and \(min-height:741px\)/);
  assert.match(css, /width:min\(100%,clamp\(46px,15\.2vw,78px\)\)/);
  assert.doesNotMatch(css, /grid-template|#quick-settings|#career-page|#setup-play/);
  assert.match(read('main.js'), /import '\.\/neon-p113-home\.css';\s*import '\.\/neon-p114-home\.css';/);
});
test('P1.14 ambience is decorative and starts only after intro, on visible active Home with motion allowed', () => {
  assert.match(read('index.html'), /<span class="rm-home-ambient" aria-hidden="true"><\/span>/);
  assert.match(css, /prefers-reduced-motion:no-preference/);
  for(const effect of ['glint','dust','podium','rival']) {
    const rule = css.split('animation:rm-p114-'+effect)[0].split('}').pop();
    assert.match(rule, /:not\(\[data-rm-intro="1"\]\)/);
    assert.match(rule, /#view-menu\.active-view/);
    assert.match(rule, /#home-hub[^\n]*:not\(\[hidden\]\)/);
  }
  assert.match(css, /pointer-events:none/);
  assert.match(css, /\.reference-rival-frame \{\s*animation:none !important/);
});
