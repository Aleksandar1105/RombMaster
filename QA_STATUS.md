## P1.12d — Activate verified local Neon Arena V2 (2026-11-25)

**ASSET PASS; SOURCE INTEGRATED; ANDROID QA PENDING.** User uploaded the optimized 1440x2560 WebP by PowerShell, commit 0706f1f, 286968 bytes, SHA256 4f3448c8d2bfbdb50b240ed1c0813b16d74aeae9fe935e8032b3a353c8632a03. Repository blob verified against local Git blob 14fe3f440fc6b14412a87ded04be38c3f870c0f8. Portrait Neon Core Home now uses V2 offline: upper 45% mapped to actual hero row, lower crystals to footer, continuous navy middle. Existing logo and wordmark share a responsive aspect-ratio box with diamond tip near the photographic podium; hide the redundant vector pedestal only in this layout. Fade scene after trace; preserve P1.7b timeline and reduced-motion behavior. Add local preload and decode, retain H6 for legacy/landscape. No changes to game mechanics, storage, buttons, currency, other skins or navigation. Two additional source tests including binary SHA256, updated startup assertion. Alignment, aspect ratio, small-height clipping and animation require physical Android QA; full npm tests/build pending. No new Picsart credits or GitHub Actions. Next P1.12e combined test APK.

---

## P1.12c — Home color harmony (2026-11-25)

User approved adapting the Home palette to the new Picsart Neon Arena V2, rather than generating another background. Source: cyan/blue secondary glass and violet/magenta Quick Play, Career and Skin Store, matching the approved concept; header rim and progress gradient, launch lights, vector rim and orbit harmonized. Original red X and cyan O symbols, board cells, wordmark raster, gameplay palette, rules, economy, rival artwork, layout, and all other screens remain unchanged. Updated color-specific assertions to the new palette without removing interaction/layout checks; added two source tests. P1.12b artwork generated for 3 credits (659 left at generation), URL https://gcdn.picsart.com/pipeline-output/68d80a15-a3c9-4d1e-bb72-6507b03e7a69.webp, 1440x2560 WebP. Binary retrieval blocked in current environment (DNS and download failure); actual palette sampling and offline asset integration pending original file upload. Existing local H6 background is deliberately retained until the new WebP can be committed and alignment verified; no external runtime URL. Color choices are based on approved mockup, not measured V2 pixels. No additional Picsart spend, no GitHub Actions. Full tests, Android compile and device QA pending.

---

## P1.12a — Approved premium reference, full-width three-group HUD (2026-11-25)

User approved the visual mockup. First source implementation: full-width Neon Core portrait header, identity/avatar/level/coins group, XP and career progress group, stars/Brain Points group, existing Settings icon on right. Bright glass edge and no new counters or duplicate IDs. Help stays in the existing lower footer. Existing six Core actions and unavailable Gems/Infinity features remain unchanged; mockup is a visual target, not an expansion of release scope. Existing game logic, native navigation, startup sequence, other skins and landscape untouched. Header uses existing nodes and scoped display:contents; explicit accessible name for progress. P1.12b new offline background/pedestal artwork is a separate asset gate, not yet integrated. Two new source tests; physical layout and full regression/build pending. No GitHub Actions.

---

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

# NEXT QA GATE — Neon Polish visual & interaction audit (2026-11-23)

Codemagic build **#48** finished for `54e29e3`. `RombMaster-Cloud-Test-48.apk` (27.89 MB) is ready for physical-device QA. [Build and artifact](https://codemagic.io/app/6afc82905eb39306a8e3c3fa/build/6b04b76fd17d55100e0f7978)

**P0 source checks: PASS. Physical-device review: PENDING.** Baseline and candidate passed 205/205 tests and production compilation. Android sync and 139 theme asset checks passed. Local Chromium executable was missing, so no rendered viewport or handset pass is claimed. Compare the two APKs at 360/393/412px, inspect selection, focus, disabled controls and Play hierarchy, then verify Quick Play isolation and the first Android Back gesture.

**Original QA handoff.** Video `34636.mp4` prompted proposed visual polish; this handoff does **not** implement it. Baseline issue is perceptual quality: flat/inconsistent buttons; insufficient tap, transition, capture and victory motion; low CTA priority on Home; overly complex, under-explained Career. Android Back user-reported GOOD and must not regress.

## Acceptance matrix for Work implementation

| ID | Surface | Required outcome | Status |
| --- | --- | --- | --- |
| NP-01 | Neon tokens | Red reads as saturated neon red, not pink; cyan/red/navy/white consistent across all Neon screens; other skins unaffected | PENDING |
| NP-02 | Button system | Clear selected/disabled/pressed states, controlled edge glow & subtle inward reflection, legible labels/icons, minimum touch dimensions | PENDING |
| NP-03 | Home | Visually dominant Play; two 3-wide rows, six rivals, Help; full portrait Home without scrolling or overlaps | PENDING |
| NP-04 | Home motion | Logo entrance finishes promptly, subdued Play pulse, tap compress/glow 120–180ms with user-configured sound/vibration | PENDING |
| NP-05 | Navigation | Quick Play never shows Home behind it; transitions 200–250ms; first Back gesture/return confirm and Continue unchanged | PENDING |
| NP-06 | Career overview | One understandable chapter flow, 6 rivals × 5 Core levels, readable current/completed/locked cards, obvious next action | PENDING |
| NP-07 | Career mission | Single primary Start Match, named Back, clear AI/board/objective, no overflow; saved stars/unlock levels intact | PENDING |
| NP-08 | Gameplay | Move and capture animations, scoreboard/Extra Turn feedback; correct shared edges, no ghost moves/input delay | PENDING |
| NP-09 | Results | Controlled victory/defeat animation, reward messaging and clear Replay/Home; no blocking or duplicate label art | PENDING |
| NP-10 | Accessibility/performance | Reduced motion, readability and tap sizes, portrait variants, offline art, acceptable FPS on phone | PENDING |
| NP-11 | Regression | Current `npm test`, `npm run build`, manual APK, cross-screen saved-data checks and handset visual QA all documented | PENDING |

**Existing evidence:** latest provided regression log before `a1ba485`: **205 tests, 204 PASS, 1 FAIL** for outdated `career-progress` text; assertion subsequently changed, but no full updated log in this handoff. Android Back user explicitly marked working. After each implementation stage log build commit, manual device screenshots/videos, explicit PASS/FAIL/BLOCKED for affected IDs, regression results, and any user approval. Do not report all NP gates as PASS based on CSS-only changes.

**Release safeguards:** no GitHub Actions, no unnecessary asset regeneration, no modification of game rules/AI/saves or other skin styles, no lost Home viewport, no Quick Play page stacking, no interactions blocked by decorative effects.

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

## Build #42 Home / Quick Play overlap report · 2026-11-23

Android owner screenshots 34582, 34584, 34586: FAIL Home Career/Profile/Store and rivals overlap and How to Play overlays portraits; FAIL Quick Play retains Home at top and requires scrolling. Candidate fix only (not yet on phone): explicit [hidden] protection, 3-way actual DOM mode-grid, one bounded Home grid without display:contents on mode-grid, and preserved screen switch scroll reset. Regression cases to verify: Home fits portrait viewport with no scroll and row order; rivals six with all states; Profile opens; Quick Play opens at top without Home/HUD/rivals and Start match remains reachable; Back returns Home; skin navigation and Android Back unaffected. Verify 360px, 393px, 412px portrait, first and returning profiles, 30-level Core. No device PASS claimed.

## Build #40 follow-up owner walkthrough 34580.mp4 · 2026-11-22

Reported: page pinch zoom, Home six rivals missing, weak logo glow, flat Neon borders / illegible game+result buttons with baked image-label duplication, tiny profile portrait. Work-in-source candidate only: native WebSettings zoom disabled and viewport fixed, Home rivals 6 x 5 levels without changing Career progression, brighter logo, cohesive button chrome and larger portrait. Phone gates PENDING: pinch, double tap and store swipe; all 6 portraits and states (new profile, level 6, 11, 16, 21, 26 and completed 30); home remains non-scroll portrait; button legibility, icon visibility and no duplicate art on match / victory / defeat; avatar HUD and camera cutout. No test suite or APK PASS claimed until executed.

## Build #40 owner report and fix candidate · 2026-11-22

Build #40 device screenshots: FAIL Android Back first gesture reveals status/navigation bars; FAIL translucent playing surface in Quick Play and gameplay (also reported Career); FAIL Home logo cell layout/fill. Fix candidate changes native bar policy, shared Neon Renderer fill and a Home-only aligned vector board overlay. Existing active-match confirmation remains. Device recheck pending: first Back from gameplay and Quick Play; Keep playing / Save & return and Continue; bottom native gesture area not obstructing controls; all board surfaces opaque INSIDE but transparent OUTSIDE; visual matching of logo wordmark, vector cell alignment and X/O at 360–412 px portrait. The Android OS may keep a navigation handle visible. NOT YET VERIFIED on a physical device.

# RombMaster — QA status

## Neon board palette and handset corrections · 2026-11-22

Cloud Test #39 (92aea6d): owner confirmed setup selection and the active-match Android Back prompt. Recording 34551 and screenshots also showed rectangular Quick Play frames, an unexplained disabled fifth-player action, and a persistent navigation handle. Updated regression exercises the fifth profile with a Cyrillic name and Fox avatar, and the capacity boundary. 192 tests, production web build, Android sync and packaged theme assets passed. Revised visuals, system gestures, audio and haptics await physical-device verification.

## Quick Play Home-style controls · 2026-11-22

192 regression tests passed. Vite production build, Capacitor sync and 139 packaged asset hash checks passed. The supplied screenshot documents the previous layout. The new appearance still needs verification in the next handset APK.

## Neon Quick Play and Android Back · 2026-11-22

Owner confirms the status bar appeared on deliberate top-edge swipe and hid after about two seconds. Previous phone build returned directly Home on Android Back. New regression checks exercise cancel via Back, confirmation and restoration of board and turn. 192/192 tests, Vite build, Android sync and 139 packaged theme assets passed. Chromium launch denied by local socket permissions; Quick Play visual and new Back behavior await the next physical-device test.

## Core phone walkthrough · 2026-11-22

34539.mp4 (94s, portrait): created a player using the keyboard; Home → Play opened guided level 1; victory 9–0 with three stars; level 2 opened; Royal preview returned to Neon; Quick Play ended 15–6. No persistent upper gray strip apparent in sampled Home and match frames. The status bar appears briefly around 0:36. Back input, exact bar timeout and resumption of the identical board were not established. Royal preview shows Profile on a separate row below How to play. APK commit is not displayed.

## Android Core Test · 2026-11-22

| Check | Result |
|---|---|
| Automated regression suite on local implementation d4f7ea0 | PASS · 192/192 |
| Browser checks at 320×568, 412×860 and 844×390 | PASS · Play, Continue after reload, Daily, board bounds and Royal preview |
| Existing level-45 profile | PASS · selector capped at 30 and stored level retained |
| Debug APK | PASS · Android build completed, signature verified and all 198 packaged web assets matched the build |
| Physical phone | Pending · top-edge coverage, first Back gesture, temporary bar reveal and hide timing |
| Career progression and installation upgrade | Pending · complete levels 1–30 on device and check progress across an in-place update |
| Google Play closed test | Pending · the isolated APK was delivered for sideload testing |

## Android recording 34528 · 2026-11-21

34528.mp4 (2m06s, 1080×2340): Home reaches the top at 0:00 and 1:14. A blank band appears above Quick Play at 0:13 and above a match at 0:25. Daily advances through three tasks; Home shows 30 Brain Points and 280 coins afterward. The recording does not identify the build SHA, exact Back input or system bar timeout. Regression suite, web build, Android sync and packaged asset hashes rechecked. Corrected top edge still needs a new phone capture.

## Android top edge and Back · 2026-11-21

190 regression tests, web build, Android sync and packaged hashes passed. Native Java compile could not start: Gradle 8.5 is not cached and the download is unreachable. Verify on phone: no top letterbox on Home and match, one side Back from menus/dialogs, top-edge pull and auto-hide, three-button Back, landscape cutout and profile keyboard. Previous multi-size visual QA remains open. No APK started.

## Neon pre-build implementation checks · 2026-11-21

190/190 regression tests passed. Vite production build and Capacitor Android sync passed. Packaged SHA256 checks passed for 37 reference, 90 Master and 12 Career assets. The built CSS includes the Neon overrides after the shared skin styles. Local Playwright could not launch Chromium because the environment denied its browser socket. Visual comparison at 320×568, 390×844 and 412×915, actual WebView layout, keyboard dismissal, app resume and transient system bars are still open. No APK build was triggered; this is a source candidate, pending visual approval.

## Neon phone walkthrough · 2026-11-21

Evidence: 139-second Android recording, 1080×2340. Home is visible both with a saved match and after victory. Reviewed Quick Play, match, victory, profile/player and character flows, store/details/preview/collection, tutorial, career, challenge puzzle, Arena and confirmation dialogs. Findings and timestamps are in ROADMAP-CURRENT.md. Intermittent system bars are visible; reproduce without an edge gesture before classifying as a fullscreen regression.

Pending targeted captures: Settings, Statistics, later tutorial steps, defeat/draw, Daily completion and reward, Arena Progress & Rewards, preview return and keyboard dismissal. For each changed screen compare with Home at small and tall viewport sizes; verify selection, disabled actions, labels, safe areas and Android Back. Verify score, save/continue, selected avatar and equipped skin survive navigation. Home must fit without scrolling and a one-item collection must stay top-left. Run the regression suite, web build, Android sync and packaged asset checks before a manual Codemagic build. This review does not constitute a new test run or device sign-off.

## Neon visual consistency · 2026-11-21

190 automated tests passed. Vite build, Android sync and the packaged asset check passed for 37 reference, 90 Master and 12 Career assets. The local browser check timed out while starting Chromium. Screen-by-screen visual approval is pending. Verify paired actions, disabled Undo, turn contrast, selected options, readable labels, dialog focus, result artwork, and skin preview/return on the phone before closing Neon.

## Android fullscreen · 2026-11-21

190 regression tests passed. Vite build, Capacitor sync and packaged asset hashes passed. Local APK compilation was blocked while the Gradle wrapper attempted to download Gradle 8.5. A Codemagic APK and device check are pending for launch, gameplay, edge-swipe navigation, app switching, keyboard dismissal and header clearance near the camera cutout.

## Neon HUD and controls · 2026-11-21

The supplied phone screenshot confirms that both play buttons render side by side in the saved-match state. For this revision, 190 regression tests passed, Vite built, Capacitor synchronized and source/dist/Android asset hashes matched (37 reference, 90 Master, 12 Career). The packaged Home contains six decorative action SVGs and a labeled Gems placeholder. Pending on Android: check HUD fit, currency readability, all six actions, Arena corners and the help button.

## Previous verification · 2026-11-21

Runtime revision `80ea07d` addresses the collapsed play buttons in the owner's screenshot 34510.jpg.

| Check | Result | Evidence or next check |
| --- | --- | --- |
| Regression suite | PASS | 190 passed, 0 failed |
| Web build and Capacitor Android sync | PASS | Both completed for this revision |
| Packaged assets | PASS | SHA-256 matched for 37 reference, 90 Master and 12 Career assets |
| Android play actions | PENDING | Resume a saved match and open Quick Play. Check full-width Quick Play on a fresh profile |
| Android visual review | PENDING | Inspect logo clearance and glow, help placement and tap action, and contrast between available and locked rivals |

## Previous checkpoint · 2026-11-21 · Neon Home

Owner feedback on the preceding build (34508.jpg): accepted the logo composition and requested transparency, a completed diamond tip, two navigation buttons, hexagonal rival captions and help at the bottom.

| Check | Result | Evidence |
| --- | --- | --- |
| Regression suite | PASS | 190 passed, 0 failed |
| Vite build and Capacitor Android sync | PASS | Both completed locally |
| Packaged art | PASS | SHA-256 matched source, dist and Android for 37 reference, 90 Master and 12 Career assets |
| Transparent Home logo | PASS | Packaged 1080 × 720 WebP has 456,882 fully transparent pixels. The completed upper point is visible in the artwork |
| Packaged navigation markup | PASS | Profile and Skin Store are the two footer actions. Help follows them. Gear targets sound and haptics |
| Android visual and interaction QA | PENDING | Build a fresh test APK. Check the logo over H6, the top tip, all six complete names, matching action sizes and help placement. Tap Profile, Skin Store, help and settings. Check narrow portrait and landscape, with and without a saved match |

Historical baseline from 2026-11-18: `11433fc`, V25.2.2 Royal Gold Master.
This documentation/asset-validation batch does not alter runtime visuals or rules.
PASS means executed and observed. PENDING means not tested; BLOCKED identifies
an unavailable test environment. Asset import success is not APK or release QA.

## Executed checks

| Check | Result | Evidence / limits |
| --- | --- | --- |
| GitHub branch/head | PASS | feat/v25-royal-master / 11433fcd6a8600e8cb8daddf02fd130f510f81c6 before this batch |
| Royal Asset Import | PASS (owner report) | 3/3; three Royal WebP files verified present in source |
| npm ci | PASS | Lockfile installation completed |
| npm test | PASS | 175 passed; 0 failed/skipped |
| npm run build | PASS | Vite production bundle completed |
| npx cap sync android | PASS | Android assets copied; 3 plugins synced |
| node scripts/verify-theme-assets.mjs --dist --android | PASS | 37 reference + 6 Master assets, SHA256 matches for dist and Android |
| Corrupted dist Royal hero negative check | PASS | Validator exited 1 for mismatched bytes; original restored |
| Missing Android Royal store image negative check | PASS | Validator exited 1 for missing file; original restored |
| Codemagic YAML syntax/machine | PASS | YAML parsed; mac_mini_m2 retained; manual workflows |
| Existing browser QA script | BLOCKED | Chromium socket creation denied by environment; 0 visual tests completed |
| Current Codemagic APK / installation | PENDING | Not run by this session |
| Royal S24 Ultra visual approval | PENDING | Owner gate below |
| Royal actual in-game phone QA | BLOCKED | Royal is locked; preview does not grant equip or start a Royal match |
| Google Play production readiness | PENDING | Not a signed production release; later release gates remain |

## Build instructions — phone only

1. In Codemagic open RombMaster → Start new build.
2. Select `feat/v25-royal-master` and **RombMaster Cloud Test APK**. Use the newest
   revision containing these QA documents and the asset-validation change.
3. Keep the configured Mac mini M2. Use remaining free macOS minutes; stop if
   payment, paid capacity or an upgrade is requested. Do not run Asset Import.
4. On success download the APK plus `source-commit.txt`. Record the build index
   and source SHA. Install/update **RombMaster Cloud Test** using the same signing
   identity. Do not uninstall or clear data. If installation fails, report its
   exact message before changing anything.
5. On build failure open the failed step and send the log from the first error
   through `What went wrong` and its cause; the final exit code alone is insufficient.

## S24 Ultra owner acceptance

Record each as PASS / FAIL / BLOCKED, with screenshot or a short video for FAIL.
Use the Cloud Test app. Preserve your existing profile and saved match.

| ID | Action | Expected |
| --- | --- | --- |
| RG01 | Open Skin Store and swipe starting directly over skin cards; switch to My Collection | Smooth navigation, no stuck drag; short collections start at top-left |
| RG02 | Open Royal Gold details | New gold/black artwork, legible text and symbols, no blank image or clipping; Coming soon/disabled equip is expected |
| RG03 | Open Royal Home preview; capture a full screenshot | Royal hero loaded, all navigation fits without Home scrolling, no overlap; preview exit available |
| RG04 | Close Home preview, then play Royal victory preview with sound enabled; capture screenshot/video | Gold crown/effect and appropriate audio; sound-off remains silent; exiting restores prior equipped skin |
| RG05 | Open Neon and Minimal White if already owned | Correct artwork; ownership/progress unchanged; no accidental Royal entitlement |
| REG01 | Continue an existing game (or start one if none), make moves, background/reopen | Board, score and turn preserved; no duplicate AI move |
| REG02 | Use Undo once where available; return Home and Continue | Correct last-human-decision rewind and persisted Undo allowance |
| REG03 | Toggle sound off/on; test Android Back from details, game and Home | Preference persists; Back returns correctly and exit confirmation appears |

Royal in-game visuals cannot be approved from Home or store preview alone.
Do not mark that gate PASS or bypass the lock by editing player progress.
No new purchases are active.

## Report template

Build index:
Source commit (from source-commit.txt):
Phone / Android version:
RG01:     RG02:     RG03:     RG04:     RG05:
REG01:    REG02:    REG03:
Royal Home / Store / Victory visual approval: APPROVED / CHANGES NEEDED
Attachments and notes:

## Gate transition

After the owner response, append exact results and revision here, update
DEVELOPMENT_STATUS.md and ROADMAP.md, fix any failures, and rerun only affected
checks plus necessary regressions. Keep unexecuted checks pending. Royal full
in-game approval remains separate until a valid test path is agreed.

## Challenge Arena · 2026-11-18

Challenge Arena changes on base db4dfc7 passed 177 automated tests, the Vite build, Capacitor Android sync and asset verification. On-device checks pending for mode labels, selected state and Infinity at locked and unlocked stages.

## Development direction · 2026-11-18

The roadmap confirmation is a planning decision. Device verification of the latest Arena UI and Royal previews remains pending.

Roadmap reconciliation on 2026-11-18 updated planning documents only. Existing Android device checks remain pending.

## V25.3.1B — Challenge Arena device QA (2026-11-19)
Owner reported 8/8 PASS after the eef9d87 build instructions: five mode graphics, mode selection, explicit Start Challenge, Blitz timer, board touch accuracy, return navigation, Progress & Rewards, Infinity lock/display. Exact installed APK hash not independently verified. Five imported WebPs at 5ebc496. Functional gate passed on owner report; final premium visual polish, background/rewards artwork, per-skin animations and audio remain open. Picsart phase allocation 75, quoted spend 20, remaining allocation 55. Next: V25.3.2 Profile and V25.3.3 Avatars; consolidate final visual polish in V25 premium engine. No automated test result inferred from device report.

## V25.4F — pending test gate (2026-11-19)
| Check | Status | Evidence required |
|---|---|---|
| Full npm test, including ten new character tests | PENDING | Codemagic regression log |
| Local assets and dist/Android SHA256 | PENDING | Both validator logs |
| Vite, Capacitor and signed cloud test APK | PENDING | Build log, source-commit.txt, SHA256SUMS.txt |
| Browser QA (five viewports, pagination/rivals, legacy flows) | PENDING | report.json and screenshots from isolated browser |
| Existing Android profile and Continue migration | PENDING | Actual update installation and owner test |
| Character filters, equip, Coin purchase and slot isolation | PENDING | Device QA using disposable test profile |
| Career rivals, all accessible skin previews, HUD and result screens | PENDING | Device screenshots and observations |
| Zero Scroll (except Skin Store) | PENDING | Measured geometry and physical device |
Do not infer visual PASS from asset presence or APK compilation. Keep real-money purchases inactive; Prestige Home preview remains unavailable by design. Browser QA is a separate local Node 22/Edge or Chrome run after npm run build; it is not part of the current Codemagic workflow. Do not reset a real player's Career solely for QA.

## V25.4F — Asset reconciliation addendum (2026-11-19)
Baseline 48a9dce, runtime/validator patch through 6acddb7. Source inventory/reference comparison PASS for 137 literal premium paths; this is not binary or device QA. New checks pending: all 16 victory previews (static where no authored effect, no ownership changes), six Career arenas and six legacy rival assets packaged-byte verification, and regression suite. Confirm static previews are legible, do not play audio and fit screen; test Android Back and store exit. No full tests or build executed by this audit.


## V25.5A — pending acceptance
Candidate runtime 2ed6560, visual test fixture 2c66bb5. Run npm test, npm run build, asset validation and visual3-browser-qa.mjs; then manual Cloud Test APK with free minutes. V25.4F remains open until verified.
| ID | Check | Status |
|---|---|---|
| PR01 | Victory emblem frameless; correct active skin | PENDING |
| PR02 | First Career win shows actual Coins and XP, total and next character | PENDING |
| PR03 | Repeat equal-star win shows zero increment; no duplicate award or unlock | PENDING |
| PR04 | Boss character/skin unlock shown only when newly earned | PENDING |
| PR05 | Defeat/draw, Quick Play and local PvP show truthful results; no invented rewards | PENDING |
| PR06 | Overview and actions fit small/large viewports; details, mission, analysis accessible without scroll | PENDING |
| PR07 | Reduced-motion setting disables reveal/count-up; sound and Back unchanged | PENDING |
| PR08 | Update preserves profile, wallet and saved matches; slot isolation | PENDING |
| PR09 | Actual device visual approval on S24 Ultra | PENDING |
No PASS asserted for tests not run. Gems remain inactive. All 16 artwork previews do not imply equippable themes; locked themes tested with isolated visual fixtures only.


## V25.5A — device feedback and A2 candidate
Owner report, Codemagic build 6aff67098f52ca2751290f01: PR01 PASS, PR02 FAIL (no visible count-up, duplicate XP and four result pages), PR04 PASS, PR09 FAIL (not at Frozen reference quality; generic buttons/fonts and redundant borders). PR03/05/06/07/08 PENDING. Summary 2 PASS / 2 FAIL / 0 BLOCKED / 5 PENDING. Exact tested source SHA not independently established.
A2 runtime through a5e5b3f, fixture 6ba7a0f: one result screen, no analysis/mission pagination, delayed 1450 ms count-up for positive earned amounts, reduced-motion respected, shared button art/display font and selective outer-frame removal. No reward formula changes. Re-test all PR cases; PR02/09 remain open until accepted. Browser and APK tests not executed here. Check zero rewards are static, positive rewards count visibly, and storage failure remains visible. Whole-game visual consistency is still open.


## V25.5A3–E — pending consolidated QA (2026-11-20)
Source candidate `c5f75366ebaeb4370e62e314ca559c032a411bd2`. A2 device video 34377.mp4: visible count-up and single result view; profile creation layout, HUD name truncation and trophy integration needed correction. Exact installed revision not established. New candidate checks (all PENDING): A3 starter picker arrows/name and one-page rewards; B HUD long names, active turn, real control icons, board fit, Undo/mute; C Career completion count, mission portrait, boss/locked/cleared states; IN01 Level 100 persisted win shows Infinity action, IN02 losses/draws/non-Career/storage failure do not, IN03 replay preserves progress and uses existing Infinity stage, IN04 navigation/slot isolation; D all four board sizes, AI/local modes, hidden difficulty on PvP, save replacement confirmation; E all catalog tabs, single card top-left, owned/equipped and prices, insufficient balance, inactive seasonal/prestige/Gems offers, portrait pagination. Run existing npm regression, build, assets/browser geometry and manual device tests; no PASS inferred from code review. PR09 owner visual approval remains pending.


## V25.5 consolidated owner device report — 2026-11-20
Owner-submitted checklist labelled `2171a45`; installed APK source revision has not been independently confirmed (source-commit.txt pending). Results: 10 PASS / 1 FAIL / 1 PENDING / 0 BLOCKED.

| ID | Check | Owner result |
|---|---|---|
| V255-01 | Home: no scroll | PASS |
| V255-02 | New Player: name, portrait and arrows | PASS |
| V255-03 | Gameplay HUD: scores, names, active player | PASS |
| V255-04 | Career: levels, missions and rivals | PASS |
| V255-05 | Quick Play: sizes and modes | PASS |
| V255-06 | Skin Store: categories | PASS |
| V255-07 | My Collection: top-left alignment | PASS |
| V255-08 | Characters: portraits, prices and unlocks | FAIL — exact symptom pending |
| V255-09 | Victory: artwork, Coins and XP animation | PASS |
| V255-10 | Continue: saved match | PASS |
| V255-11 | Sound, Undo and Android Back | PASS |
| V255-12 | Preserved profiles, skins and Coins | PENDING |

Uploaded regression log: 189/190 PASS, failure #125 was stale Career progress label assertion. Test-only repair and strengthened profile assertions at `07a96fd`; rerun result not yet received. Browser QA and dedicated Level 100-to-Infinity path verification remain pending. Hold V25.6 until character defect is diagnosed and retested, preservation is confirmed, and outstanding technical checks pass. No runtime change in this documentation update.


## V25.5G1–G2 Neon visual overhaul — candidate (2026-11-21)
Owner videos 34427.mp4 and 34428.mp4 flagged unfinished Neon home HUD, mixed Frozen-like profile buttons, native player selector, awkward new-player form, and generic Skin Store/Career. Implemented G1/G2 candidate at `75e8cc8`: Neon-only header/HUD visual hierarchy and borderless help, profile chrome and original themed button artwork, custom visible local-player buttons wired to existing guarded select/switch flow, and simplified new-player form/picker. Existing hidden select remains as compatibility bridge; storage and entitlement logic unchanged. G3 Skin Store, G4 Career, G5 shared component consistency and G6 device/browser regression are NOT implemented or signed off. Test pending: player switching across 1–4 slots, unreadable storage, creation limits, profile form, keyboard focus, mobile heights, no-scroll, Neon vs Frozen appearance, browser regression and manual APK. V25.5 QA FAIL remains open pending owner approval.


## V25.5G3 Neon Skin Store candidate — 2026-11-21
Implemented at `df813c5` as Neon-scoped CSS only: catalog tabs use Neon master button art, card outer borders and nested rarity outlines removed, preview artwork emphasized, equipped state has a single bottom accent, catalog pagination and detail actions use Neon art, detail background and nav chrome simplified, and focus-visible outlines retained. No catalog IDs, prices, entitlement, purchase logic, Gems status, profile storage or non-Neon skins changed. NOT TESTED: CSS computed layout, preview artwork per skin, mobile no-scroll, tap targets, Skin Store/Seasonal/Prestige/My Collection, detail screens, visual comparison and APK regression. Keep G3 QA pending; G4–G6 remain outstanding.


## V25.5G4 Neon Career visual candidate — 2026-11-21
CSS-only Neon Career redesign at `fc5ddb4`: long full-width level rows changed to compact two-column mission tiles (three columns in short landscape); boss and selected states differentiated; themed navigation/start buttons, simplified background, borderless rival portraits, readable progress/mission typography and focus outlines. No Career progress, AI, rewards, purchases or save logic changed. This is an unverified implementation, NOT device/browser QA PASS. Verify chapter/level layout 1–100, selected/locked/boss states, missions/rivals, small-screen overflow and tap targets, and regression. G5 shared component consistency and G6 regression remain open.


## V25.5G5 Neon shared controls candidate — 2026-11-21
Commit `21508ad`: Neon-scoped visual normalization of secondary-screen actions (Profile, Quick Play, Sound, Skin Store, Career, help/confirmation/Daily dialogs), shared display font, button artwork, input focus/tap targets, accessible focus-visible outlines and reduced-motion override. Intentionally excludes game-board hit targets, character artwork, mission tiles, home navigation and other skins. CSS-only; no economy, persistence, audio or progression code changed. **Unverified** on device/browser: theme art rendering, visual specificity/cascade interactions, keyboard accessibility, 44px target fit and small-screen overflow. G6 QA is required before V25.5 closure and V25.6.


## V25.5G6a owner screenshot/video findings — 2026-11-21
Owner provided 8 screenshots and 34448.mp4 (103 s): home and Quick Play backdrop obscured by panels; header unfinished; Frozen-like ornate button art across secondary screens, game controls and Arena; character tiles show rectangular backplates; confirmation panel has border and uneven buttons; Arena board backed by opaque panel; Arena Progress second page vertically centered; stray player-character art near rivals reported. Candidate visual fixes in `5393548` and `2d26d32` use Neon-only CSS to remove backdrop panels, adjust HUD layout, use slimmer Neon controls, remove avatar tile surfaces and add selected glow, normalize confirm actions, clear Arena board panel and anchor Progress top. **Not tested in APK or browser.** Stray player-character art between rival groups remains under investigation; per-character aura color needs data-driven avatar accent verification; no claim that those two issues are resolved. Confirm gameplay, profile persistence and 100-level progression unchanged by this CSS-only patch. Owner approval pending.
