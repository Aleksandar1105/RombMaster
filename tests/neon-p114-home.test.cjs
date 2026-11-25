const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname,'../src',name),'utf8');
const css = read('neon-p114-home.css');
test('P1.14 retains compact-height safeguard and isolates portrait growth to visible Core Neon Home', () => {
  assert.match(css, /@media \(orientation:portrait\) and \(min-height:741px\)/);
  assert.match(css, /width:min\(100%,clamp\(46px,15\.2vw,78px\)\)/);
  const ambience = css.split('/* P1.14.1')[0];
  assert.doesNotMatch(ambience, /grid-template/);
  assert.doesNotMatch(css, /#quick-settings|#career-page|#setup-play/);
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

test('P1.14.1 aligns actual coin icon, number and caption inside the existing HUD', () => {
  const hud = css.split('/* P1.14.1')[1];
  assert.ok(hud);
  const rules = hud.split('}').filter(rule => rule.includes('{'));
  const ruleFor = suffix => rules.find(rule => rule.slice(0, rule.lastIndexOf('{')).trim().endsWith(suffix)) || '';
  const coin = ruleFor('.home-status-row .home-coin-count');
  const icon = ruleFor('.home-coin-count .wallet-symbol');
  const number = ruleFor('.home-coin-count #premium-player-coins');
  const label = ruleFor('.home-coin-count .rm-hud-label');
  assert.match(coin, /grid-template-columns:auto minmax\(0,max-content\) !important/);
  assert.match(icon, /grid-column:1 !important;grid-row:1 !important/);
  assert.match(number, /grid-column:2 !important;grid-row:1 !important/);
  assert.match(label, /grid-column:1\/-1 !important;grid-row:2 !important/);
  for (const rule of rules) {
    assert.match(rule, /#home-hub[^\n]*:not\(\[hidden\]\) #premium-home-progress:not\(\[hidden\]\)/);
  }
  assert.doesNotMatch(hud, /animation\s*:|@keyframes/);
});
