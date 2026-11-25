## P1.11 — Integrated Home source review / combined APK gate (2026-11-25)

**SOURCE INTEGRATED; FULL REGRESSION AND PHONE QA REQUIRED.** Found three concrete integration defects: legacy rival caption pseudo-element and clipped 25px name plate could survive P1.9; P1.9 test read all following CSS and would fail after P1.10 introduced grid declarations; removing the startup intro could restart the older P1.2 Home entry fade. Fixed explicit Core-only caption reset, bounded phase-test slices, and startup-settled marker/timeout cleanup (normal showHome clears it). Neutralized old portrait -7px row offsets and 1.08 logo scale to reserve the actual hero box for the new pedestal; no changes to logo lattice or Home background artwork. Added three integration source regressions, extended startup VM assertion. All six prior Home polish objectives now implemented in source, NOT accepted as phone PASS. Combined Codemagic APK is the next gate. Verify test suite, compilation, cold/warm startup, 2-point trace then logo then UI, no replay or duplicate fade, platform visible, buttons/disabled Continue, six rivals and HUD, no clipping/scroll on device, Android Back, game/save/other skins. No GitHub Actions, no Picsart credits. Browser/WebView pixel QA and full npm suite not run here; repository connector provides source but no execution runner.

---

## P1.10 — Organized and readable Home HUD (2026-11-25)

**SOURCE IMPLEMENTED; ANDROID QA PENDING.** Reorganized the existing Neon/Core header into an explicit responsive grid: avatar and player identity, larger XP and stars, coins and Brain Points on their own aligned row, 44×44 CSS-pixel Settings control, separate level/progress label and a 6px progress bar. Added restrained glass panel material and tabular numeric styling. Preserve existing safe-area padding, original DOM IDs, actual wallet/XP/daily/career values and Core campaign cap. Gems remain hidden because Core has no active Gems currency; no fictional balances or duplicate counters. CSS only; no changes to gameplay, save data, native navigation, other skins or other screens. Added two source regressions. Physical QA required at 360/393/412px, compact height, long names, high balances, unavailable data, safe area and non-scrollable Home. Next P1.11 integration review and combined APK. No GitHub Actions or Picsart credits.

---

## P1.9 — Larger Home rival portraits and plain names (2026-11-25)

**SOURCE IMPLEMENTED; ANDROID QA PENDING.** Updated the six existing Neon/Core Home rival portraits to fit almost the full width of their six equal columns (up to 68px, with a compact portrait-height fallback). Retain the original local character artwork, diamond frames and real Career state. Names are plain text without plates, border or shadow boxes and can wrap instead of clipping Grandmaster. Current rival uses a cyan glow on its outer diamond frame (not the clipped image), with reduced-motion support; locked portraits are less excessively dim and remain identifiable, defeated rivals retain a subdued gold state cue. Six Home images now load eagerly with async decoding so they can be ready sooner when the startup intro finishes; Career images remain lazy. No changes to progression, names, saved data, navigation, other skins, Career screens, Home grid structure or asset generation. Added three source regressions. Verify 360/393/412px portrait and compact height, all six names visible, actual current rival, no overlap with buttons or Help. Next P1.10 header, then P1.11 combined QA. No GitHub Actions, no Picsart credits. Full tests, APK and phone QA not yet run.

---

## P1.8 — Faceted luminous glass Home controls (2026-11-24)

**SOURCE IMPLEMENTED; ANDROID QA PENDING.** Following user reference `34697.png`, revised the EXISTING `src/neon-p1-material.css` in the same `@layer neonControls`, not another competing style layer. Six real Home buttons now use brighter beveled rims, diagonal translucent facets, stronger top and bottom specular highlights, internal glass depth and dark centers for readable text. Play remains cyan-primary; Career and Skin Store get coral glass accents, other controls cyan; disabled Continue remains muted. Apply external glow to existing action rows so the child clip-path does not cut the entire shadow off; How to play receives matching compact glass treatment. Preserve P1.6 ::after press sweep, existing button geometry and all other screens. No art assets, layout, navigation, game logic, startup sequencing or Picsart credits changed in this step. Added two P1.8 source regressions. Existing P1.3/P1.5 paint-only checks retain their prior invariants. Next: P1.9 rivals, P1.10 HUD, then combined Android QA for P1.7b–P1.11. Full test/build and physical phone visuals still pending. No GitHub Actions.

---

## P1.7b — two-light logo trace and delayed Home reveal (2026-11-24)

Video `34694.mp4` shows the new startup guard functioning and logo assembly visible, but Home controls appear before the logo is complete. User requests two light bodies drawing the logo first, then the rest of the screen. Reference `34697.png` is a style reference, not a replacement of the current cyan/coral X/O artwork or current Core six-action layout. Implemented in source: dark launch cover with two points instead of a static logo; two SVG light sources move along complementary exact perimeter halves and draw synchronized cyan/coral traces; existing logo rim/cells/X/O, orbit, wordmark and a new luminous vector pedestal appear next; Home background and actual HUD/buttons/rivals/footer reveal last (~2.7–3.05s). One-time document startup only; normal navigation remains static. Native Android OS launch icon remains OS-controlled. Reduced motion skips optional intro. No new raster assets or Picsart credits. Remaining Home polish: stronger glass/reflections, larger rival portraits with plain names, organized wallet/XP/level header. Full npm tests, Android build and video QA pending; no GitHub Actions.

---

## Regression build unblock — 2026-11-24

Codemagic log `run_regression_tests.log (4).txt`: **236 test results, 235 PASS, 1 FAIL**. All six dedicated startup source assertions passed, but `tests/input.test.cjs` failed as a suite after four asynchronous unhandled rejections: the VM window does not provide `matchMedia`. The new startup callback set its internal revealed flag before calling the unsupported API, so an exception could also leave the launch cover visible. Fixed the production capability check: missing/throwing media query or reduced motion skips optional logo assembly, while Home still reveals. Normal supported non-reduced-motion Android behavior is unchanged. Added an executable VM regression covering all four cases and early-click cleanup. No changes to artwork, timing, Android native splash or gameplay. Full regression run and APK compilation remain pending; device QA for P1.6a/P1.7 is still blocked. No GitHub Actions.

---

## P1.6a / P1.7 follow-up — Android video 34690.mp4 (2026-11-24)

**PHONE FAIL at prior source; NEW SOURCE FIX, QA PENDING.** Video first launch shows old complete Home preview then blank navy then Home; second launch shows Android icon/black then partial dim labels before Home. Likely native Task Snapshot plus WebView visibility race; source confirms visibility can be overridden by descendants and P1.3 `!important` animation overrides the logo wordmark. New source: explicit navy native splash/window/WebView background and AndroidX splash setup, API 33+ recents screenshot opt-out (Overview preview becomes generic; ordinary screen recording unaffected), opaque Web launch guard with branded cover and retry rather than exposing incomplete UI on main-module failure, and temporary startup-only 1.7-second logo assembly with rim, cells, symbols, orbit and wordmark. Removes obsolete P1.3 conflicting animation. No wallpaper, board geometry, gameplay, saved data, button layout or Back changes. Existing old OS snapshots may persist until task recreation. Full regression suite and Android compilation, then fresh and warm launch phone QA required; do not claim PASS yet. Do not use GitHub Actions. P1.8 remains blocked until startup QA passes.

---

## P1.6a follow-up — gate existing logo animation on first visible frame (2026-11-24)

Source inspection after the reported startup/absent logo motion shows that the existing P1.1 logo animation can run while the initial WebView guard hides the app. Added the readiness flag to the three existing logo animation selectors so the rim, symbols and wordmark start only after the guard releases, plus a regression assertion. No timings, geometry, artwork, buttons, navigation, native splash or game state changed. This is NOT the P1.7 startup-only assembly; replay on later Home returns has not yet been addressed. The native startup flash is not confirmed resolved. Full regression/build and cold-start phone footage required; no GitHub Actions.

---

## Android regression build unblock — 2026-11-24

Codemagic `RombMaster Cloud Test APK` for source `46aec69` stopped at `npm test`: **232 tests, 230 PASS, 2 FAIL**. The uploaded `run_regression_tests.log (3).txt` identifies exactly two obsolete test assertions, not demonstrated application regressions: `tests/neon-career-clarity.test.cjs` test #150 still expected the old 300×533 `neon-home-calm-300.webp` despite approved P1.4 switching to local 893×1600 `neon-home-h6.webp`; `tests/neon-p1-transitions.test.cjs` test #162 assumed an adjacent Home visibility pair despite P1.6 intentionally inserting `clearNeonHomePress(document)` between those two assignments. Updated ONLY those test expectations and strengthened offline-art checks. No changes to application logic/CSS/assets or any runtime behavior. Source-level preflight verifies both fixes match current code, but **all 232 tests must be rerun in Codemagic**. No APK and no Android PASS are claimed yet; do not start P1.7 until build and cold-start recording pass. Build manually in Codemagic on `feat/android-closed-test-core` using the `RombMaster Cloud Test APK` workflow; do NOT use GitHub Actions.

---

## P1.6a — Eliminate WebView startup FOUC before P1.7 (2026-11-24)

**CODE IMPLEMENTED; ANDROID QA PENDING.** Startup footage `34665.mp4` around 0.9s shows a partially styled default Home (small diamonds, placeholder regions) before the final Neon screen. `34667.mp4` around 0.58s shows a partly rendered/dim Home before full graphics. The current HTML displays visible menu DOM while most Neon styles load through JS imports; this creates a first-paint race. Android splash configuration also immediately exits (`launchShowDuration:0`). This is not the planned logo animation.

Added an INLINE Core-only launch visibility guard at the start of the HTML head. The app remains over a matching dark-navy background until the main module initializes the UI and local `neon-home-h6.webp` + `neon-home-logo.webp` are decoded; assets are preloaded in HTML. JS reveals at most after 2 seconds, with an additional 3-second HTML fail-open so errors cannot leave a permanently blank screen. Only the Core initial display is gated; other editions unaffected. No navigation, layout, button, Continue, Back, saved game, P1.6 press animation, native theme or splash config changed. **P1.7 must assemble the logo once on initial launch AFTER the ready flag and never replay on Home navigation.**

Added source regression test `tests/neon-startup-firstframe.test.cjs`. **Full npm tests, Vite build, Codemagic and Android phone QA are still PENDING.** Validate cold start/warm launch, no briefly unstyled Home or missing Continue, no prolonged blank screen, no logo re-animation on return, Quick Play/Career navigation and Android Back. No GitHub Actions.

---

## Neon Polish P1.6 — Home press microinteraction (2026-11-24)

**IMPLEMENTED IN SOURCE; TEST/APK/PHONE QA STILL PENDING.** On Android Core + Neon Home six action buttons, pointerdown triggers an immediate 230ms press effect rather than relying on a nearly invisible :active-only style. CSS scales slightly inward (0.963) then recovers while a pair of Cyan light sweeps travels from the outer ends toward the center using a reusable `::after` surface behind the text. Existing `::before` glass and P1.5 button materials are preserved. The short press class is cleaned by animationend/cancel and when returning Home; repeated touches restart it. Keyboard Enter/Space and screen-reader synthetic click are also supported. Disabled Continue, nonprimary/right click and other skins never animate. Reduced-motion suppresses animation.

Source files: `src/neon-home-press.js` (no timers; capture listeners only for feedback), `src/neon-p1-press.css` imported after existing P1.5 styles, and minimal wiring in `src/main.js`. **No extra sound/haptic trigger**: the existing document-wide click handler already calls `Native.vibrate('light')` and `Game.playButtonSound()` with the user's existing preferences. No delaying or intercepting clicks, no new image assets, no button/layout/background/logo, game rules, save data or Android Back changes.

New `tests/neon-p16-press.test.cjs` covers simulated input paths, cleanup, reduced-motion, scope and unchanged sound/haptic ownership. This is not a completed build: full `npm test`, `npm run build`, Codemagic APK and physical device video are still required before marking Android PASS. Check rapid Home→Quick Play and Home→Career transitions, keyboard, disabled Continue, no blocked taps and no layout jank. P1.7 next: longer one-time logo assembly **only on initial app startup** (not each Home return). No GitHub Actions.

---

## Neon Polish P1.5 — brighter primary Play, calmer secondary Home glass (2026-11-24)

**IMPLEMENTED IN CODE; ANDROID VISUAL QA PENDING.** Following the approved sequence P1.4 -> P1.5 -> P1.6 -> P1.7, revised the EXISTING `src/neon-p1-material.css` rather than stacking another competing CSS layer. All styles remain inside the named `@layer neonControls`, scoped to Neon + Core + visible premium Home two rows. Secondary Continue, Daily, Career, Profile and Skin Store receive a darker navy glass face and subdued rim with highlights concentrated at their upper corners. Play has a distinctly lighter cyan-blue glass face, brighter cyan light on BOTH upper corners, a slightly thicker luminous rim (via inset 3.25px), clearer label and cyan icon, and stronger but restrained 3.8s cyan breathing halo. No permanent flashing of other controls. **No button geometry, sizing, grid columns, backdrop, logo, rivals, saved-game state, game rules, navigation or Android Back edits.** Existing `prefers-reduced-motion` remains. P1.6 will add the more noticeable light-sweep/ripple touch feedback separately; P1.7 will change logo to startup-only assembly.

Updated the historical P1.3 test to reflect the improved layered radial-gradient material and new pulse and added `tests/neon-p15-material.test.cjs`. Checked source constraints; full `npm test`, `npm run build` and Android APK test still REQUIRED. On the next phone test compare Play vs Continue/Daily in a static screenshot at 360/393/412px, first load with disabled Continue, label contrast, highlight isolation and existing pressed feedback. If Play still does not stand out, inspect computed `--rim`, `--face`, `::before` and `filter` in Android WebView rather than adding more arbitrary overrides. No GitHub Actions.

---

## Neon Polish P1.4: stable Continue and crisp offline Home (2026-11-24)

SOURCE IMPLEMENTED — FULL TEST/ANDROID QA PENDING. User video 34667.mp4 shows Continue disappearing on the first render and a pixelated Home background. Root cause of Continue: Game.init refreshes saved-game button BEFORE syncSkin assigns data-skin=neon; P0.1 incorrectly depended on this skin flag. Core always uses Neon, so Continue now uses data-edition=core alone; visible but disabled on empty save, enabled on resumable save, never removed from first Home row. Non-Core editions retain original behavior. Added a first-launch regression test.

The current Home override scaled a 300×533 local `neon-home-calm-300.webp` (4266 bytes). Changed Home only to already bundled `neon-home-h6.webp` (893×1600, 117884 bytes) plus a subtle navy readability gradient; no blur. The high-resolution composition is from the same Neon arena family but has more visible crystalline geometry and reflections. Other screens, buttons, game saves and Android Back unchanged. Updated tests expecting the old low-resolution image and startup condition. No Picsart credits or network are needed.

This change is NOT device-verified. Before marking PASS run npm test, npm run build and a manual Codemagic `RombMaster Cloud Test APK` (not GitHub Actions). Verify no Continue gap at fresh install, after finishing a match, and when resuming; check art sharpness/readability at 360/393/412px; ensure Quick Play remains isolated and Back unaffected. Next: P1.5 premium Play/button contrast; P1.6 touch ripple/press animation; P1.7 one-time logo assembly on launch.

---

## Neon Polish P1.3 — premium Home button material (2026-11-24)

IMPLEMENTED IN SOURCE; ANDROID QA PENDING. Latest phone video 34665.mp4 showed Play insufficiently prominent, flat secondary Home buttons and a wordmark dimmed too long on returning Home. Root cause: named cascade layer neonControls applies important --rim/--face and background values, so earlier P1.1 --neon-action-* settings did not reliably affect the final rendered surface.

Added isolated src/neon-p1-material.css, imported last, reopening the EXISTING neonControls layer. Strict scope: Android Core / Neon / visible premium Home / two rows of action buttons. Secondary buttons use darker navy glass, subtle cyan/coral rim and upper-corner reflection; Play has brighter cyan-focused rim, illuminated face and icon. Re-tuned the EXISTING single 3.8s Play pulse to cyan (not pink). Existing wordmark now fades from 68% to full opacity within 260ms after a 120ms start. Reduced-motion disables those effects. No layout, button dimensions, backgrounds, rivals, Career, Quick Play, gameplay, saving, score, native Back, sound, haptics, other skins or GitHub Actions changed.

Added tests/neon-p13-material.test.cjs checking actual cascade variables, load order, scope, unchanged native Back/Continue and reduced motion. Commit preflight checks source structure only. Full npm test, npm run build, Codemagic APK and phone QA NOT RUN here. Next gate: run full suite and build, manually build RombMaster Cloud Test APK, and compare Play vs Continue/Daily, dim disabled Continue, icon readability, logo reveal, two fixed rows and Back at 360/393/412px portrait. Do not mark device PASS until actual evidence.

---
## Neon Polish P1.2 — safe entry transitions for Home / Quick Play / Career (2026-11-23)

**Source implementation candidate; device QA PENDING.** Added isolated `src/neon-p1-transitions.css` after P1.1 styles, limited to Android Core + Neon. Home **foreground controls/rivals/help** fade from 72% and move only 6px to their existing position over 220ms; the wallpaper and animated logo remain anchored. Quick Play and Career content separately enter with a 7px fade/slide over 220ms. On small-height devices this is 170ms; `prefers-reduced-motion: reduce` disables transitions. The existing navigation still hides the old screen **immediately**, reveals the new screen **immediately**, resets scroll position and responds to Android Back without delay; this change does not modify JS handlers, DOM order, game rules, saves, audio, vibrate, or other skins. P1.2 uses CSS-only animation of already-visible content: there is no delayed exit animation and no overlay swallowing taps. The new source test `tests/neon-p1-transitions.test.cjs` asserts scope, load order, 220ms effects, reduced-motion and hidden view invariants. **No `npm test` / `npm run build` or Android APK executed yet**, so do not mark visual polish PASS. Suggested next gate: run full test suite and build, manually generate Codemagic `RombMaster Cloud Test APK` from this branch, then check Home→Quick Play→Back→Career→Back and game→Home on 360/393/412px portrait, including reduced motion. Protect P0.1 disabled Continue and P1.1 Play/logo. No GitHub Actions.

## Neon Polish P1.1 — Home primary CTA and controlled microinteractions (2026-11-23)

**Source implementation only; Android QA PENDING.** Preserves the approved Home geometry, the two rows of three buttons, six rivals, locally approved artwork, existing X/O logo, disabled Continue behavior and working Android Back. New isolated file `src/neon-p1-home.css` imports **after** the existing Neon styles from `src/main.js` to avoid reworking broad legacy CSS rules. Neon Android Core visible Home only: Play uses a tuned cyan/red rim, dark-glass inner fill, stronger word contrast and **one** subtle 3.8s breathing glow; active Home buttons compress slightly (~150ms), with a short light response; hover only applies on fine pointers. The existing calibrated logo animates in a short rim -> symbols -> wordmark sequence (~1s total) when Home becomes visible. Reduced-motion disables the animations and transition delays. No changes to underlying button handlers, sound/haptics, scroll behavior, AI, scoring, saves, Career, Quick Play, other skins or native Back. Source regression test `tests/neon-p1-home.test.cjs` added; full `npm test`, `npm run build`, Codemagic APK and handset PASS not yet verified. Next: run the test/build gate and visually inspect Home across 360/393/412 px before P1.2 screen transitions. Avoid GitHub Actions.
  
## Neon Polish P0.3 — typography, contrast and icon legibility (2026-11-23)

**Code candidate committed; handset QA PENDING.** A small refinement after P0.1 Continue slot and P0.2 controlled cyan/red palette. Raised minimum label sizes in the Home action row, Quick Play headings/subtitles, Career level-status copy and gameplay bottom action captions. Increased SVG icon stroke weight and improved text/icon contrast in Home, Quick Play and result actions. CSS only: `src/neon-screens.css`, `src/skin-store-compact.css`; one regression test. **Preserved** the Home grid geometry, button widths/heights, backdrop, existing Neon button material, Android Back, saved data and game rules. Disabled Continue was intentionally excluded from the enabled-text emphasis. QA gates P0.1–P0.3 remain unverified on phone. Before accepting: run full `npm test`, `npm run build`, generate APK manually with Codemagic (never GitHub Actions), check 360/393/412px portrait. Pay attention to three-column Home (Continue and Skin Store), four-column Quick Play labels, Career state captions, and in-game Undo/Restart/Sound/Home. No claim of compiled/tested device PASS.

## P0.2 Neon palette audit — first controlled color pass (2026-11-23)

**Implementation candidate, NOT device-approved.** Following the rejected broad Build #48 material rewrite, this pass updates existing color variables/gradient stops in `src/skin-store-compact.css` and `src/neon-screens.css` only. Candidate tokens: cyan `#2DE6F4`, red `#FF5965`, navy `#0A1C30`, text `#F3FAFF`. Removed the conspicuous pink/magenta accents from existing Neon button-rim sources; kept a cyan default for Home, and gave Home **Play** a differentiated red rim. Selected Quick Play and dialog primary buttons also use red, while the existing button silhouettes, border widths, positioning, face overlays, font sizes and interactions are unchanged. **No new universal button override, no animation or DOM layout change**; other skins untouched. Added a source regression test. Device gates NP-01 and NP-02 remain PENDING (check color, contrast, disabled Continue, Play hierarchy, Quick Play selected states, Career, game controls, results and dialogs). Run full `npm test` + `npm run build` and then one Codemagic APK for phone comparison before accepting. No GitHub Actions.

## P0.1 — Fixed Home Continue slot after victory (2026-11-23)

Separate from the Build #48 rejected button material, `Game.refreshSavedGame()` previously set `continueBtn.hidden = saved.status !== 'ready'`. Thus a finished match intentionally removed the first button, visually breaking the 3-wide Home row. Android Core + Neon now reserves the exact same Continue element and **disables** it when no resumable save exists; the button is visibly dimmed with the existing CSS shape, no alternative action is triggered, and a short title/accessible label explains why it is unavailable. When a save exists it is enabled as before. Other skins/editions preserve their old visibility behavior. The regression test checks that an empty-save Continue is disabled; other saved-match tests remain. **QA: source-only change, APK/phone verification PENDING.** Start next with systematic Neon palette/button component audit (P0.2); do not add broad CSS overrides until the Home flow and rendering are checked. No GitHub Actions.

## Neon P0 Build #48 rollback (2026-11-23)

User reviewed `34638.mp4` (~42.8s) and **rejected** the P0 visual materials from `54e29e3` (Build #48) due to weak first impression and a missing Home first-row item after a match. This is a **non-destructive source rollback** to the pre-P0 styling/test versions from `1d4c273`, not a force-reset: only `src/neon-screens.css` and `tests/neon-build40-followup.test.cjs` are restored; the established documents and later build records are preserved. Root cause of the vanishing Continue tile is separate, preexisting behavior in `src/game.js:refreshSavedGame()`: hides the control if no resumable save, which breaks stable Home visual hierarchy after victory. Track it as P0.1; do not equate missing Continue with lost saved progress. Resume Neon Polish in small testable increments and never change gameplay/AI/profile state, other skins or native Android Back. No GitHub Actions. Rollback commit itself was not yet compiled or tested on a device.

# NEXT — RombMaster Android 1.0 / Neon Polish (design and UX handoff, 2026-11-23)

Codemagic build **#48** finished for `54e29e3`. `RombMaster-Cloud-Test-48.apk` (27.89 MB) is ready for physical-device QA. [Build and artifact](https://codemagic.io/app/6afc82905eb39306a8e3c3fa/build/6b04b76fd17d55100e0f7978)

**P0 candidate implemented from 1d4c273.** Compare the candidate with the previous APK on the same handset before accepting the palette. Next gate: NP-01, NP-02 and Home hierarchy in NP-03. P1–P3 remain planned.

**Original handoff.** This is the prioritized proposal distilled from the latest physical-device walkthrough `34636.mp4` and the user's request to make RombMaster more visually polished, distinctive, animated and intuitive. Continue implementation in ChatGPT Work. Base repository `Aleksandar1105/RombMaster`, current working branch `feat/android-closed-test-core`; start from the actual HEAD when Work begins (do not assume a hard-coded SHA). **Do not use GitHub Actions.** Use manual/local tests and Codemagic `RombMaster Cloud Test APK` for Android verification.

## Product direction / non-negotiable design boundaries

- **Refine, do not restart.** Preserve the accepted Neon dark-blue arena, locally bundled Home background, cyan/red X/O identity, geometric/hexagonal button silhouette, Home logo, six rivals and the current feature set. Keep existing save files/progress, player slots, Career gameplay and AI, Quick Play, Daily, Shop, Back behavior and monetization roadmap unchanged unless a later explicit decision requires it.
- **Avoid visual noise.** Keep background darker and quieter behind information. Give one clear focal point per screen; controlled bloom/depth rather than every element blinking. No new backgrounds, logo replacement or Picsart credits required for the initial polish. Use CSS/SVG/Canvas animations and crisp, scalable UI.
- **Navigation:** Home always fits portrait without vertical scrolling; two rows of three buttons remain (**Continue / Play / Daily**; **Career / Profile / Skin Store**), followed by six rivals and How to Play. Quick Play is an independent view; never show Home behind it. Android Back already behaves correctly on device: protect this regression.
- **Proposed color tokens (design candidates, not yet signed-off implementation):** Neon Cyan `#2DE6F4`, Neon Red `#FF5965` (stronger red, less pink), Deep Navy `#0A1C30`, Text White `#F3FAFF`. Define tokens centrally, verify all Neon controls/states, ensure text contrast and consistency before sweeping replacements. Keep other skins unaffected.
- **Performance and accessibility:** target responsive animation at ~60 fps on supported phones (measure, do not promise), avoid animation-induced input delay, preserve ~44px+ touch targets and readable labels, honor `prefers-reduced-motion` / comfort settings, and keep essential assets available offline.

## Execution order and acceptance gates

### P0 — Foundations: unified Neon visual language (first implementation batch)
- Audit all Neon buttons, selected/unselected/disabled states, typography, borders, gradients, icons, result controls, secondary screens and legacy image-based chrome. Replace inconsistent pinkish mixed borders with a coordinated cyan/red system only after a side-by-side phone comparison.
- Establish one reusable button surface: dark glass/navy face; subtle inner reflection/edge light; measured outer glow and depth; readable white type; cyan as default interaction accent, red as X/active/important accent. Choose a visibly stronger **Play** CTA while keeping existing geometry and button order.
- Define shared scale and motion tokens; avoid the existing cascade of per-screen CSS overrides. Where feasible isolate polish styles in a maintainable layer without rewriting game logic.
- **Gate:** all buttons are visually unified across Home, Quick Play, Career, Profile, Skin Store, gameplay, dialogs and Results; icons and labels remain readable; selected/disabled states unmistakable; no inherited raster duplicates; no new overlap or Home scroll.

### P1 — Home + Quick Play first impression
- Make **Play** the visual focal point (clearer fill/inner glow + discreet slow breathing pulse); Continue and Daily secondary. Keep the two existing 3-wide button rows, six portrait rivals and How to Play.
- Add a *brief entrance sequence*: diamond highlights → X/O → RombMaster wordmark, then settle. Never continually animate all components. Make buttons react on press with small compression + inward light sweep + existing short sound/haptic response, roughly **120–180 ms**.
- Use light transition/fade+small offset between Home/Quick Play/other subpages, roughly **200–250 ms**; avoid UI jump or stacked screens.
- **Gate:** immediate visual focus on Play; balanced, non-scrolling Home; rivals current/defeated/locked clearly distinguished; Quick Play opens at top without Home content; single-tap input and Android Back remain correct.

### P2 — Career clarity and child-friendly flow
- Replace the confusing stacked navigation/dual arrow pairs and oversized, largely empty level tiles with one intuitive chapter/rival selector: **6 opponents, 5 levels each in Android Core (1–5, 6–10, ... 26–30)**, large current chapter/rival header and a clearly visible progress indicator.
- Compact, legible level cards use *number + stars/check + state*; completed in color, current highlighted with an unmistakable **Play Level N**, future locked and dimmed. Replace tiny explanatory copy with meaningful large labels and simple visual symbols; show mission details on selection instead of cluttering the level overview.
- Keep the mission preview with a single dominant **Start Match** CTA and a clearly named Back control (not an arrow alone). Display completion and next unlock information *inside Career* in a child-readable presentation, not as tiny Home rival subtitles.
- **Gate:** a child can identify current level, completed levels, locked levels and the next action without explanation; saved progress/maps unchanged; current rival/chapter across screens is consistent.

### P3 — Gameplay feedback and results
- Preserve board and rules, implement short nonblocking line-draw glow (~**120–180 ms**), cell ownership fill + X/O highlight (~**200–300 ms**), score bump on capture, subtle particles traveling toward scoreboard and **Extra Turn** cue (~**400–600 ms**). Active player is always evident.
- Refine Undo / Restart / Sound / Home visually; their behavior stays unchanged. Victory/defeat: reveal/reward animation, crystal shine and optional XP/count-up, total celebration about **900–1200 ms** without blocking further interactions.
- **Gate:** a move can be made immediately even if effects from a prior move are still playing; turn/game rules and scoring unchanged, no ghost input, no audio buildup or seizure-like flashing.

### P4 — Device QA and release gate (after each completed batch)
- Run local regression suite and production web build before every manual Codemagic APK; no GitHub Actions. Test both fresh and returning player, saves, Career 1–30 states, Home/Quick Play, Daily, store, sound and vibration, Android Back/exit confirmation, results, offline background loading and viewport variants.
- Compare at least 360px / 393px / 412px portrait with representative Android hardware; check FPS/perceived jank, tap latency and reduced-motion fallback. Use explicit PASS/FAIL/BLOCKED and screenshots/video per milestone. Never mark anything PASS merely because code compiles.
- Roll out in small reversible commits: visual tokens & CTA → Home transitions → Career overview → gameplay/rewards. Update all three status docs after each gate. Avoid unrequested new assets or changes to other skins.

**Work restart prompt:** “Продолжи со RombMaster од GitHub `Aleksandar1105/RombMaster`, гранка `feat/android-closed-test-core`. Прочитај `ROADMAP-CURRENT.md`, `DEVELOPMENT_STATUS.md`, `QA_STATUS.md`, почни со P0 Neon Polish, зачувај ги Home и Android Back регресиите, направи тестови и нов APK преку Codemagic, без GitHub Actions. Не означувај QA PASS без реална проверка.”

---

## Codemagic regression log #2 — obsolete Career label assertion · 2026-11-23

The uploaded `run_regression_tests.log (2).txt` contains 205 tests: 204 PASS, 1 FAIL. Test 128 (`multiple local players keep match saves and Career progress independent`) stopped at `tests/input.test.cjs:409` because the expected legacy text `0 / 100 levels cleared · Level 1 unlocked` no longer matches the intentional new label `Completed 0 of 100 · Next: Level 1` in `src/main.js:renderCareerProgress`. The test is updated to check the actual new text, while its meter, per-player stored data, saved games and switching assertions remain unchanged. No game logic or UI modifications in this commit. The uploaded log reflects the earlier candidate, and the full suite / Android build must be rerun on this commit before claiming PASS. No GitHub Actions.

## Core Career presentation mapping audit · 2026-11-23

The visual Career chapter and rival label for Android Core are now derived from the same 5-level grouping as the six Home rivals (1–5 / 6–10 / 11–15 / 16–20 / 21–25 / 26–30). This changes presentation only, not underlying Career gameplay, AI difficulty, persistent world data or rewards. Optional chaining on DOM querySelector protects lightweight test stubs. Verify chapter labels, per-rival locked/cleared/current states and mission screens in Android. No handset PASS claimed.

## Regression test sync · 2026-11-23

The previous background-trial regression test still expected the temporary Picsart URL and searched beyond the Home-only section. It now checks the locally bundled WebP and scopes its assertions to the background trial block, without incorrectly inspecting newer Career polish CSS. Phone/regression suite still pending; no automated PASS claimed.

## Android Core UI polish gate · 2026-11-23

Owner screenshot/video review: accepted Home background, requested offline local image, lift Home hero and both button rows by 7px, improve rival title and hide level-range subtitles on Home, smaller Help. Neon controls across screens use less magenta / more coral-red in the rim while keeping cyan. Back button visible as '← Back'; native Android Back behavior unchanged. Career overview: compact selected / completed / locked cards, simpler labels and progress indication, clear 3-step navigation, centered chapter navigation; Career mission condensed, clearer caption. Core rival collection follows 6 groups of 5, without mutating saved 100-level data. The asset at public/assets/premium/master/neon-home-calm-300.webp is a locally bundled, aggressively compressed 300px wide WebP test asset derived from the accepted artwork; validate quality on phone and replace with higher-resolution local artwork before final release if needed. No CI claim until tests + Android QA rerun. GitHub Actions not used.

## Neon Home background trial · 2026-11-23

User approved trying the newly generated subdued blue/coral Neon chamber background, ONLY on the Home screen. Added a final CSS override in `src/neon-screens.css` scoped to the visible Neon premium Home hub, replacing the old split Home wallpaper with a single portrait composition and a dark fallback. The HUD, button styling/positions, hero wordmark+X/O board, six rivals/statuses, Help, Quick Play, game, result panel and all non-Neon skins are unchanged. Source artwork is stored durably in Picsart Drive as `rombmaster_neon_home_trial.png` and referenced through a Picsart-hosted URL during this test. This source needs network at runtime; before release, rehost as an optimized local asset in `public/assets/` for offline support. Device screenshot QA required: verify image loading, legibility, alignment and menu navigation; no automatic tests, Android build or phone visual PASS have been claimed. No GitHub Actions.

## Build #43 Codemagic Run regression tests: one false-negative assertion · 2026-11-23

Uploaded Codemagic test log: 201 tests total, 200 passed, 1 failed (test 145, Neon Home preserves logos and restores true rendered match button content). The sole failing expression looked for a whitespace-sensitive literal `grid-template-columns:repeat(3,minmax(0,1fr)) !important`; current, semantically identical CSS uses a space after ':' in `grid-template-columns: repeat(3,minmax(0,1fr)) !important`. The updated test selects the actual Core Neon Home `.mode-grid` block and checks a three-column layout with whitespace-tolerant matching. Live CSS and navigation have NOT been altered by this commit. Targeted source-rule verification passed; rerun full Codemagic regression tests and phone QA is still required, and no new APK or full PASS is claimed. No GitHub Actions.

## Android Core Home/Quick Play screen isolation · 2026-11-23

Fix highest-priority Build #42 navigation regression: make [hidden] authoritative for Home and Quick Play, present Home controls in two separate rows (Continue/Play/Daily; Career/Profile/Skin Store), followed by all six rivals and How to Play, no Home scrolling. Keep Quick Play as a separate full-screen setup with its own scrolling only if its layout cannot fit (never display Home behind it). Run tests, build and install new Codemagic APK manually. No GitHub Actions; preserve profile, saves, game logic, logo and Neon design.

## Build #40 follow-up phone gate · 2026-11-22

Owner video 34580.mp4 adds five corrections: disable zoom, restore six Career Rivals after Career/Profile/Store controls and before Help (Core intervals of five to level 30), increase Neon logo shine and chromed gradient button legibility, remove legacy match/result button art, enlarge Home portrait while preserving progress visibility. Next gate: run source regression / web build / Android sync and manual Codemagic APK on feat/android-closed-test-core, then phone QA. Keep Home non-scrolling, catalog swipe-scrolling, saved games and original 100-level world mapping unchanged. No GitHub Actions.

## Build #40 correction gate · 2026-11-22

Three owner-reported defects in Android Build #40: first system Back gesture swallowed by bar reveal; transparency through the active playing cells across match/setup/Career; crooked X/O Home logo board. Prepare the code fix on feat/android-closed-test-core, then build manually with Codemagic (not GitHub Actions). Verify native Back with the tradeoff of a visible OS gesture indicator, all boards and the reconstructed board on Home. Do not carry prior PASS to the new APK. Do not change progress, saved games, score or AI.

# RombMaster — current roadmap checkpoint

## Neon board palette and handset corrections · 2026-11-22

Use the board cyan O and coral X as the Neon palette across Home, setup, match and secondary controls. Next handset gate covers the revised button silhouettes, fifth player creation and bottom-edge immersive gesture.

## Quick Play Home-style controls · 2026-11-22

Quick Play now uses the approved Home scene and control geometry. Next phone review: all mode, size and difficulty choices, Back and Start match, selected-state visibility and preview contrast.

## Neon Quick Play and Android Back · 2026-11-22

Neon Home accepted by owner for this stage; minor polish deferred to Play Store release candidate. Royal preview layout deferred. Current review scope: Neon Quick Play setup and active-match Android Back. Verify both confirmation choices and Continue on the next handset build.

## Core phone walkthrough · 2026-11-22

Phone walkthrough covers new-player entry, the first Career win, opening level 2, Royal preview and a complete Quick Play match. Next verify active-match Back and resume, then progress through level 30 and test an in-place update.

## Android Core Test · 2026-11-22

1. Test the isolated APK on a physical Android phone. Check the top edge, first Back gesture and temporary status-bar reveal on Home, setup and during a match.
2. Play through Career levels 1–30 on the phone. Check Continue after restart and verify existing progress during an in-place upgrade of a compatible test installation.
3. Observe first-time players completing a match, starting another and returning for Daily. Use those findings to refine the opening and the daily puzzle.
4. Prepare a signed AAB and start the Google Play closed test after device QA. The current deliverable is a sideloadable test APK.

## Android recording 34528 · 2026-11-21

Verify the secondary-screen top edge on the next test APK. On the phone, compare Home, Quick Play setup, a continued match and a newly started match; check a side Back gesture separately from a top-edge pull.

## Android top edge and Back · 2026-11-21

The Android candidate draws into the camera area and keeps Android Back navigation available. Next phone check: compare a side Back gesture with a pull from the top; record the actual transient-bar timeout.

## Neon pre-build implementation · 2026-11-21

The six screen groups in the recorded walkthrough now have a Neon styling pass. Next checkpoint: run the visual comparisons and Android system-bar checks in phase 7 below before approving the next APK build. No new skin assets or economy changes were needed.

## Neon Android video review and pre-build plan · 2026-11-21

Reference: the 2m19s portrait recording 34526.mp4. Use the opening Home as the reference for the active Neon skin. Preserve its transparent crystal artwork, compact player header, dark surfaces, beveled controls and restrained cyan/magenta highlights. The Home with an active match (0:00) and after victory (0:28) are two valid states.

| Order | Evidence in the recording | Work before the next test APK |
| --- | --- | --- |
| 1. Shared Neon controls and branding | Home has the illustrated wordmark. Match and Victory use a plain diamond and type. Store and Arena use the older two-line logo. | Derive a compact header wordmark from the approved artwork. Use a shared title/back header, button bevel, icon size, text alignment, focus and disabled treatments. Specify primary, secondary and selected states. Reserve the full hero scene for Home. Keep geometry reusable and colors, art, effects and audio selectable per skin. |
| 2. Quick Play and live match | 0:02–0:22. The size preview responds, but mode, size and AI tiles have similar dark faces. Scores and turn occupy narrow strips, far from the small board. | Give each selected option a clear marker. Group board preview and Play. In the match, consolidate scores, active player and turn, leave room for the board and anchor the four controls inside the safe area. Use red X and blue O consistently; retain a single shared edge. Check 9, 21, 37 and 57 cells and both local and AI turns. |
| 3. Confirmations, tutorial and result | 0:14 replace-match, 0:24–0:27 victory, 1:42 tutorial, 2:14 leave-challenge. Victory separates 8–1, crystal and actions with large empty bands. | Compose result, score and existing trophy together. Use the same action row in results and dialogs. Clearly distinguish Continue Playing from destructive actions. Keep the tutorial diagram prominent, show the step and make Next and Close visually distinct. Reuse the pattern for defeat and draw. |
| 4. Profile and collection | 0:30–0:58. Players and tabs use bright textured frames, character filters use plain rectangular tiles and equipped characters use a third treatment. | Give tabs, filters and player choice a common selected state. Highlight the equipped portrait with a readable badge. Give the name field, Save, avatar arrows, page indicators and statistics the same spacing and label sizes. Verify the keyboard and long player names. |
| 5. Career, Daily and Challenge Arena | 1:46–2:00 shows levels, rivals, mission and match. At 2:08 the first challenge shows a puzzle, and at 2:10–2:16 Arena artwork competes with small descriptions. | Align level cards, mission brief and rival portraits with Home. Distinguish selected, cleared, available and locked. For Daily, group objective, board, progress and reward. In Arena give each card a readable title over a quiet text area and put the selected mode’s rule beside Start. Keep Infinity’s unlock condition visible. Carry the style through Progress & Rewards. |
| 6. Store, previews and Settings | 1:00–1:32 shows catalog, details, My Collection, Prestige and two other skin previews. Single-item collection starts at the upper left. | Keep the collection top-left and the catalog scrollable. Unify header, price, balance, lock and equip states. Keep the preview's own art and palette; use a consistent Exit preview action and restore Neon on return. Apply the same controls to Settings and verify toggles and back navigation. |
| 7. Layout and Android verification | The system bars appear intermittently, including around 1:08, 1:22 and 2:00. The recording does not establish the trigger. | Before packaging, compare screen captures at 320×568, 390×844 and 412×915 CSS pixels. Test safe areas and screen overflow. Reproduce system bar behavior on the current APK at idle, after a swipe, preview exit, app resume and keyboard dismissal. Verify again on the candidate APK. |

Use existing art for the first pass. Only commission a compact transparent wordmark if the existing artwork cannot be reused legibly at header size. No new skin artwork is required for this milestone. Complete phases 1–6 and the pre-packaging checks in phase 7 before the next manual Codemagic build. Keep final phone approval open until the candidate has been tested.

Long-term milestones are in ROADMAP.md.

## Continuing development

For every project change, update ROADMAP-CURRENT.md (milestone and next step), DEVELOPMENT_STATUS.md (implementation and revision) and QA_STATUS.md (checks run, results and pending checks) in the same commit. When starting a new conversation, read all three at the current branch head.

## Neon visual consistency · 2026-11-21

Neon Home H6 is the visual baseline for the full Neon experience. Review Quick Play, Career, Daily, Arena, Profile, Store, Settings, gameplay, help, confirmations and results on Android before closing Neon. After Neon approval, each new skin should adapt the complete experience: scenery, typography, controls, HUD, board, dialogs, effects, results and audio. Verify switching themes and returning to Neon.

## Android fullscreen · 2026-11-21

Android fullscreen is implemented for Home and gameplay. Next device review: cold start, resume after switching apps, transient bars on an edge swipe and keyboard dismissal on the player-name field.

## Neon HUD and controls · 2026-11-21

Neon Home HUD and action icons are ready for the next Android visual review. The owner screenshot shows the repaired play row. Review the compact currency display, action bevels and centered help label. Gems remain reserved for a future economy milestone.

## Previous Android review · 2026-11-21

Runtime revision `80ea07d`. Screenshot 34510.jpg from the owner prompted a Neon Home correction to the play row, transparent logo lighting, help button and rival availability. Next gate: check this revision on Android with a saved match and on a fresh profile.

### Implementation and verification

The two play buttons use an explicit horizontal flex row with automatic widths. With no saved match, Quick Play fills the row. The transparent logo is 8% larger in portrait and has contour lighting. Help has a smaller hexagonal button, and locked portraits are dimmed. Rival status is visually hidden but available to screen readers.

190 tests passed, the web build and Android sync completed, and source, dist and Android assets matched. Phone interaction and visual confirmation for this revision remain pending.

## Previous milestone · 2026-11-21

V25.5 Neon Home is in visual review on `feat/v25-royal-master`. The owner approved the H6 arena and the wordmark/board composition in `b24c50b`. This revision integrates a transparent emblem, simplifies the bottom navigation and moves help below it. The next gate is a manual Codemagic **RombMaster Cloud Test APK** and owner review on Android. V25.6 remains planned.
