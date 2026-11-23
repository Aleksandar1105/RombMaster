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
