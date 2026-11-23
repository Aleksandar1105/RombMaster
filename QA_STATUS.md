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
