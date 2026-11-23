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
