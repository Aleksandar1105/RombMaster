const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.resolve(__dirname,'..',name),'utf8');

test('Core Home relocates the real Profile control before Skin Store, never clones it', () => {
 const js=read('src/main.js');
 assert.match(js,/function arrangeCoreHomeNavigation\(\)/);
 assert.match(js,/if \(!coreEdition\) return/);
 assert.match(js,/modeGrid\.insertBefore\(profileButton, skinStoreButton\)/);
 assert.match(js,/homeTools\.hidden = true/);
 assert.match(js,/arrangeCoreHomeNavigation\(\)/);
 const html=read('src/index.html');
 assert.equal((html.match(/data-page="player-settings" class="nav-tile"/g)||[]).length,1);
});

test('Hidden Home can never be visibly rendered above Quick Play', () => {
 const css=read('src/neon-screens.css');
 assert.match(css,/#view-menu #home-hub\[hidden\],[\s\S]*?#view-menu #menu-page\[hidden\] \{\s*display:none !important/);
 assert.match(css,/#home-hub\[data-home-revision="3"\][^\n]*:not\(\[hidden\]\):has\(#premium-hero-stage:not\(\[hidden\]\)\)/);
 const js=read('src/main.js');
 assert.match(js,/el\('home-hub'\)\.hidden = true;\s*el\('menu-page'\)\.hidden = false;\s*ui\.viewMenu\.scrollTop = 0/);
});

test('Core Home has non-overlapping HUD, hero, actions, rivals and Help rows', () => {
 const css=read('src/neon-screens.css');
 assert.match(css,/grid-template-rows:auto 0 minmax\(95px,1fr\)/);
 assert.match(css,/#premium-rivals-section:not\(\[hidden\]\) \{[\s\S]*?grid-column:1 !important;grid-row:6 !important/);
 assert.match(css,/\.home-help-footer \{[\s\S]*?grid-column:1 !important;grid-row:7 !important/);
 assert.match(css,/\.mode-grid \{[\s\S]*?grid-template-columns: repeat\(3,minmax\(0,1fr\)\) !important/);
 assert.match(css,/\.mode-grid > button \{[\s\S]*?grid-column:auto !important;grid-row:auto !important/);
});
