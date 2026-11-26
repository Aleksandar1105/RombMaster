# RombMaster — Roadmap to V30.0

## Android 1.0 closed-test scope · 2026-11-22

The branch `feat/android-closed-test-core` starts at `8a69e12` on `feat/v25-royal-master`. The first Android release focuses on short offline matches, a guided opening, up to 30 phone-tested Career levels, Quick Play, local two-player games and a daily puzzle. Neon is included. Royal is available for preview.

Run the first Play closed test without ads or purchases. Defer Infinity, seasons, Gems and the character collection. Revisit cosmetic purchases, purchase restoration and optional rewarded ads after playtesting. iOS follows the Android release. The V30 milestones below describe longer-term work. See [the current checkpoint](ROADMAP-CURRENT.md) for release order.

Updated: 2026-11-18. Active branch: `feat/v25-royal-master`.
Goal: a commercial production release for Google Play.

## Provenance and authority

This document restores the November 18 conversation plan, reconciled with source
at `11433fcd6a8600e8cb8daddf02fd130f510f81c6`. Earlier plans in
`docs/RELEASE-ROADMAP.md` and `docs/PROFESSIONAL-GAME-ROADMAP.md` are historical:
their old step numbers are not the current V25–V30 milestones.
The owner supplied the [original development proposal](https://chatgpt.com/s/t_6afe1ea1341c819183f71018b0790553). Its nine milestones are the baseline. Its progress percentages, prices, budget allocations and calendar estimates are planning examples. Use fresh QA evidence for current status.

## Delivery rules

- No GitHub Actions. Manual Codemagic builds on `mac_mini_m2`, using available
  free macOS minutes only. If exhausted, pause; never enable paid capacity.
- No paid services or new spending without owner approval. Picsart balance of
  894 credits is owner-reported, not a live balance or authorization to spend.
- Preserve game rules, existing unlock conditions, local profiles, progress,
  saved matches, Undo, audio preferences and Android Back behavior.
- Preserve approved skin artwork, typography, colors, effects, avatars, layout
  and the single shared two-color board boundary. Home stays non-scrollable;
  Skin Store must accept swipes over cards. A short collection stays at the
  top and aligned left.
- Stop for physical-phone QA, visual approval, or a material product decision.
  Automated checks do not replace those gates.
- Update this file, DEVELOPMENT_STATUS.md and QA_STATUS.md with each completed
  development batch, test outcome, owner decision or gate transition. Record
  the tested revision and evidence; never carry forward PASS to changed code.

## Milestones

| Phase | Scope | Current state / exit gate |
| --- | --- | --- |
| V25 | Complete 16 skins, each with coherent Home, store, arena, symbols, sound and victory treatment | In progress. V25.2.2 Royal Gold Master: imported assets; APK and phone visual approval pending. Neon final phone validation remains open. Then Cyberpunk, Ice & Fire, Classic Wood, Minimal White, seasonal and Prestige skins. Approve each skin before moving on. |
| V26 | Career 100 levels, Quick Play, Local 2 Players, AI, board sizes, challenges, tutorial and statistics | Much of the foundation exists. Audit completeness and balance; verify complete matches, progression and interruptions on device. |
| V27 | Daily Streak, Missions, rewards, achievements and seasonal events | Existing daily/engagement modules are foundations, not acceptance evidence for the whole milestone. Validate reset and reward integrity. |
| V28 | Cosmetic monetization, no pay-to-win | Purchase/restore and commercial decisions remain pending. Current locked previews do not represent purchases. No live billing or advertising activation at this stage. |
| V28.5 | Local RombMaster Ranks and statistics | Planned offline progression; preserve player isolation and save compatibility. |
| V29 | Performance & Quality | Optimize and test stability and performance across Android phones. |
| V29.5 | Google Play Preparation | Prepare the privacy policy, production AAB, app icon, marketing materials and store listing. |
| V29.9 | Closed Beta Testing | Run a closed beta with real players, fix reported issues and verify fixes. |
| V30.0 | Production Release | Publish on Google Play after device QA, beta acceptance, release checks and owner approval. |
| V31 (deferred) | Online multiplayer, global tournaments and server rankings | Outside V30 scope. Do not introduce servers/subscriptions during current work. |

## Agreed 16-skin target

| Group | Skins | Repository reality at 11433fc |
| --- | --- | --- |
| Base | Neon Arena; Royal Gold; Cyberpunk; Ice & Fire; Classic Wood; Minimal White | Six definitions; Master assets currently for Neon and Royal. Royal remains a locked preview. |
| Seasonal / premium | Autumn Kingdom; Frozen Christmas; Golden Dragon; Spring Blossom; Summer Paradise; Halloween Curse; Midnight Gold | Seven definitions, previews and reference artwork. Final Master approval remains pending. |
| Additional Prestige target | Obsidian Neon; Celestial Void; Synthwave Sunset | Not in the current catalog; planned, not implemented or approved artwork. |

## Immediate next gate

Run **RombMaster Cloud Test APK**, not Asset Import, on the current branch after
this batch is committed. Follow QA_STATUS.md on the Samsung S24 Ultra. Do not
change unlock rules to make Royal equipable for testing. Its existing store,
Home and victory previews can be approved first; full in-match Royal phone QA
remains a separate unresolved gate. Do not start Cyberpunk generation until
Royal feedback is resolved.

## Challenge Arena · 2026-11-18

V25 now explicitly includes visual approval of the Challenge Arena mode cards, selected state and Infinity unlock presentation across skins. Verify on Android before closing the visual gate.

## Development direction · 2026-11-18

The owner confirmed the earlier development proposal as the baseline through V30. Place improvements in the relevant milestone and use APK feedback to refine them. Changes to scope or milestone order should be agreed explicitly.

## Product details recovered from the original proposal

- V25 covers each skin's Home, arena, store card, board material, X/O, typography, buttons, capture and victory animations, sound and results screen.
- V26 proposes ten chapters of ten levels. In order: First Steps, Tactical Mind, Territory Wars, The Challenger, Strategic Control, Arena Elite, Grand Tactics, Legendary Battles, Master League and RombMaster. Vary opening layouts, move limits, tactical objectives and opponents.
- V27 includes streaks, daily and weekly missions, achievements, collectibles and seasonal events. Reward amounts in the mockups are illustrative.
- V28 proposes a free base game, virtual currency, cosmetic purchases, purchase restoration and mostly voluntary rewarded ads outside matches. Indicative EUR prices: Royal Gold 1.99, premium skin 2.99, seasonal skin 3.99, Prestige skin 4.99, three-skin pack 6.99, Remove Ads 3.99 and Ultimate Collection 19.99.
- V28.5 proposes Bronze, Silver, Gold, Platinum, Diamond and RombMaster ranks for local progression and AI competition.
- The proposed 894-credit allocation was 240 for skin graphics, 180 for effects and animations, 110 for audio, 90 for icons/avatars/rewards, 120 for promotional assets and 154 in reserve. Spending requires separate authorization.
- Original working estimates were 4–6 weeks to a complete beta and 6–8 weeks to release, assuming regular testing and timely approvals. These estimates do not set a launch date.
- Release criteria cover all 16 skin visuals, 100 balanced levels, distinct AI strategies, daily challenges and rewards, a working store, verified purchase and restore flows, optimized animation and sound, no critical Android defects, successful beta testing, Play documentation and the production AAB.

## Owner-approved adaptive board direction · 2026-11-18
- V25.4: responsive phone/tablet UI; preserve non-scrolling Home and the approved layered premium visual references (Frozen Christmas, Royal Gold, Golden Dragon, Spring Blossom, Midnight Gold, Summer Paradise).
- V26.1–V26.4: show board names alongside actual N × N dimensions; offer automatic recommendation and manual selection with previews. Existing sizes and save formats must be audited before changes. Larger boards are free functionality, gated by usable play area and touch accuracy rather than physical diagonal or device branding. Show unavailable sizes with a reason.
- Candidate sizes 4, 6, 8, 10, 12, 16 and optionally 20 are proposals, not current engine capabilities. Validate available width AND height, board geometry, hit testing, AI latency, memory, save/resume and rotation before setting thresholds. Do not silently resize or discard saved matches. Landscape and foldable support are targets subject to QA; no cross-device sync promise.
- V29: verify phone/tablet/foldable layouts and performance. Static themed visuals precede per-skin sound and animation production.
- Current Arena asset import: owner logs confirm self-test, conversion and push PASS at 5ebc496 (five WebP files). APK and device UI/interaction QA still pending. Resume this gate before expanding gameplay scope.

## V25.3.1B — Challenge Arena device QA (2026-11-19)
Owner reported 8/8 PASS after the eef9d87 build instructions: five mode graphics, mode selection, explicit Start Challenge, Blitz timer, board touch accuracy, return navigation, Progress & Rewards, Infinity lock/display. Exact installed APK hash not independently verified. Five imported WebPs at 5ebc496. Functional gate passed on owner report; final premium visual polish, background/rewards artwork, per-skin animations and audio remain open. Picsart phase allocation 75, quoted spend 20, remaining allocation 55. Next: V25.3.2 Profile and V25.3.3 Avatars; consolidate final visual polish in V25 premium engine. No automated test result inferred from device report.

## V25.4D6 — Character collection direction (2026-11-19)
Owner proposed character unlocks through Career progression, earned currencies and monetization. Design recommendation (provisional, not live pricing): retain all seven existing avatar IDs and prior unlocks; six free starters, six Career boss reward characters at levels 10/25/40/60/80/100, six earned-currency Elite characters, six Legendary paid cosmetic characters, optional later seasonal tie-ins. Existing Neon Fox at level 5 remains a bonus, not removed. Coin prices 400–1500 and proposed Gems prices 100–300 are balancing targets, not production purchase offers. Gems and real-money billing belong to V27/V28; no live payments, loot boxes, paid gameplay advantage or duplicate currency wallets. Use one player-scoped cosmetic wallet, atomic debits/entitlements, preserve ownership on Career reset and legacy profile migration. Profile selection and new-player creation must use the same portrait resources; paid/unearned characters cannot be equipped or chosen as starter. Six Career Rivals retain independent AI progression and distinct identities; reward player portraits may be distinct variants rather than changing opponent strength. First D6 art batch updates six existing free avatars plus Neon Fox, preserving their IDs; new collectible characters follow after entitlement/UI tests. ZERO SCROLL including avatar catalog and detail pages. All 16 victory assets imported at 2fb017b; result integration b278eaf pending QA. Owner explicitly authorizes use of all remaining Picsart credits for project quality, not automatic top-up or additional cash charges; quote each batch. Static art before sound/animation. No GitHub Actions.

## V25.4F — regression gate (2026-11-19)
D6/E implementation is in code; V25.4F is testing only. Build candidate with the manual Cloud Test APK workflow after browser test updates and documentation reconciliation. Verification remains pending until actual logs and device evidence arrive. V26 gameplay expansion must not begin before reviewing the regression/device gate. Prestige themes remain previews; custom per-skin audio and animation refinement and final release approval are not implied by the static asset batch.

## V25.4F — Picsart reconciliation (2026-11-19)
Drive inventory and branch cross-check documented in `docs/PICSART-ASSET-AUDIT.md`. All 16 victory artworks are now accessible via animated or static store previews; Prestige remains locked and Home preview is intentionally pending. No new generation or gameplay expansion. Complete regression and phone QA before moving on.


## V25.5–V25.9 — owner-approved premium visual completion (2026-11-19)
The owner approved the following phased direction after gameplay video review. Frozen Christmas Home is the visual quality reference, not a replacement for each skin's own artwork. Preserve the V25.4F regression gate; do not mark it passed without evidence. V25.5A implementation may begin now by explicit owner instruction; release and V26 expansion remain gated.

- V25.5A Premium Victory & Rewards: reuse existing victory emblems, remove unnecessary art frame, make the overview immediately useful, show actual persisted Coins and XP, new unlocks and next reachable Career reward; keep next mission and analysis accessible without scrolling. Distinct defeat/draw treatment; reduced motion; no second reward grant.
- V25.5B Gameplay HUD: theme-aware portraits, scores, turn/goal indicator and controls; preserve single shared boundary, board geometry, hit testing, Undo and save/resume.
- V25.5C Career & Rivals: improve six rival cards, locked/defeated states, chapter/progression visuals. AI and balance remain V26.
- V25.5D Quick Play: improve selectors, active state, board preview and Play CTA; new sizes remain V26.
- V25.5E Skin Store & Character Collection: common visual system, clear ownership/preview states, top-left short collections, single store; polish Profile/Daily/Challenge Arena consistently. Prestige Home remains pending until approved.
- V25.6 Reward & Economy UX: display actual balances, earned rewards, XP and attainable milestones; no fabricated currencies or changed reward rules. Gems and billing stay inactive until V27/V28.
- V25.7 Full Skin Adaptation: finalize coherent Home, arena, controls, results and effects for 16 skins.
- V25.8 Premium Audio: distinct themed feedback, mute preference and lifecycle checks.
- V25.9 Final Visual QA: viewport/device coverage and owner approval before V26.

Use existing assets first (target zero new Picsart credits for V25.5A); no Actions, paid capacity, live billing or ads. No gameplay or economy changes. Keep all non-store screens non-scrolling, with accessible pagination and responsive layout. Save migration, repeat/replayed matches, unlock integrity, reduced motion and Android Back are acceptance gates. Manual Codemagic Cloud Test APK only, after code review and regression checks.


### V25.5A2 — owner correction
One result page only; no duplicate XP, mission preview or match-statistics pages after a match. Keep score, stars, actual rewards, unlocks and actions together. Positive reward increments should visibly animate unless reduced motion enabled. Frozen Christmas Home remains quality benchmark for every screen; use existing full thematic button art, purposefully differentiated typography and fewer decorative outlines (retain functional state/focus boundaries and board edges). Do not close V25.5A or advance to B until the owner reviews the result fix; the broader all-screen visual redesign remains V25.5B–E/V25.7 scope.


### V25.5 implementation candidates — 2026-11-20
A3 starter layout/result art (`1edeb42`), B HUD (`c4561b5`), C Career/rivals (`7c1d9c6`), owner-requested Level 100 Infinity continuation (`ad5655f`), D Quick Play (`8af325c`), E collections (`c5f7536`) are staged on feat/v25-royal-master. Owner requested continuation between batches; this is not visual sign-off. Gate before release: reconcile all changes, run regression and asset/browser checks, then manual free Codemagic APK and owner device visual approval. No GitHub Actions, billing or additional art generation. V25.6 remains next planned implementation scope.

## P1.14 — Final Home polish candidate (2026-11-25)

Owner visually accepted P1.13.2 after video 34738.mp4, then explicitly requested one final Home iteration before freezing. Preserve baseline 9b51205; the prior Codemagic log had 224/259 PASS with 35 failures caused by the missing HUD children in the test fixture. P1.13.2 fixed the fixture and added one test; rerun log not received here. P1.14 adds a separate CSS file imported after P1.13.1, one decorative aria-hidden overlay, and two source tests (78d6741). Portrait Core Neon Home only: rival frames grow from 13vw to 15.2vw subject to six-column fit, only at heights >=741px; existing compact rule retained. Current rival uses a static filter plus opacity-only rim overlay instead of an animated filter. Logo glint, four small drifting highlights and existing podium contact-light opacity pulse run only on active visible Home after intro, with reduced-motion support. Glint animates background position briefly; Android performance is not profiled. No new raster assets, Picsart spend, gameplay, storage, navigation, HUD, button or intro changes. No GitHub Actions. Full regression (expected 262 tests if no other changes), APK and device visual/geometry/performance QA pending. Verify cold launch, no replay on return, all six names, compact portrait, no clipping, normal touch and reduced motion. If appearance or smoothness regresses, use baseline 9b51205. Freeze only after owner approves this candidate; Quick Play P2 next.

## P1.14.1 — Final Home HUD and combined build gate (2026-11-25)

Re-reviewed video 34738.mp4 (45.86s, 1080x2340) including sampled startup and return-to-Home frames. Owner requests one combined final build rather than further speculative redesign. In the prior video the coin icon sits above its number; P1.14.1 explicitly places icon and live number in row 1, caption in row 2, overrides inherited single-column grid, aligns the four counters, adds static avatar rim, restrained open navy-violet gradient, level/settings material, and 7px progress bar. Source 22b347c. No changes to game logic, live values, Home outer grid, artwork or intro. P1.14 test previously prohibited all grid-template declarations in the entire stylesheet; narrowed that assertion to the unchanged ambience section and added a separate HUD alignment/scoping test at 532045c. Source-level checks passed; full Node suite, Android compile and new device performance/visual checks NOT executed here. Expected 263 tests (259 original + one fixture test + two ambience tests + one HUD test). Run one manual Codemagic Cloud Test APK on feat/android-closed-test-core; no Actions, new credits or paid capacity. Acceptance: 0 failed tests, no startup flash/stutter, aligned real counters and high balances, settings reachable, six rival names visible, no clipping/scroll, subtle glint/pulse/dust only after intro, normal/reduced motion, gameplay and return Home without replay. 10/10 is an acceptance goal, not an established score; freeze Home only after owner confirms. Retain 9b51205 as prior visually accepted source baseline (exact APK hash unverified). P2 Quick Play after approval.

## P1.14.1 — Combined regression and Android video QA (2026-11-25)

Owner supplied run_regression_tests.log (6).txt and 34740.mp4 (39.50 s, 1080x2340). **AUTOMATED REGRESSION PASS: 263/263, 0 failed, cancelled, skipped or todo; 3365.128 ms.** Tests 144 and 181–183 confirm HUD fixture, scoped ambience and coin layout. Video: sequential frame extraction confirms one continuous two-light intro, then logo/scene and controls (~4.4–5.0 s), no visible reverse/replay in sequential samples. Initial random-seek sampling showed out-of-order frames, corrected by sequential decoding; not an app defect. Home shows aligned 660 Coins, 1050 XP, 15 Stars, 0 Brain Points, Level 7 and Career progress 6/30, all six actions and six named rivals. Continue opens a saved Quick Play match (~21 s), Return to Home? confirmation appears (~22 s), Save & Return leads to Home (~23 s), Career opens (~24.5 s), Settings opens (~34 s), Exit RombMaster? appears (~37 s), exit returns to launcher. No full new match or reward grant captured in this video. No obvious clipping or intro replay in sampled Home frames. Individual ambient effect timing, exact FPS/frame pacing, reduced motion, compact viewport, large balances, physical sound/haptics remain unverified. Exact APK commit hash not embedded in supplied log/video; expected candidate 6641bbb. Recommendation: accept current Home visually and freeze after explicit owner approval; P2 Quick Play next. No runtime changes, new assets, Actions or paid capacity in this QA documentation update.

## P1 CLOSED — Neon Arena Home Final Edition / P2 begins (2026-11-25)

Owner explicitly approved final Home after reviewing the P1.14.1 candidate and QA. Freeze Home runtime design at candidate 6641bbb44b0db90672c58aa7bb21ce8856ebd55b (source checkpoint; exact installed APK SHA not independently verified). Uploaded run_regression_tests.log (6).txt: 263/263 PASS, zero failures/cancellations/skips/todo, 3365.128 ms. Video 34740.mp4 (39.5 s) demonstrates one intro, aligned four live counters, six actions and named rivals, Continue, return confirmation and Home without intro replay, Career and Settings navigation, and exit confirmation. Visual acceptance is owner-approved, not measured 60 FPS or exhaustive device QA. Reduced motion, smaller/slower devices, high balances, physical sound/haptics and complete match/reward verification remain final QA tasks. Do not alter Home artwork, layout, header, controls or intro in P2; only fix verified regressions if needed.

P2 Quick Play starts with a visual concept for owner approval before runtime changes: preserve existing two game modes, four board sizes and three AI difficulties, actual board preview and Start match; match Neon glass material, cyan secondary and violet primary/selected treatment, clear labels, visible back action, no Home logo or overlay, no ordinary portrait scrolling. Preserve existing save/replace confirmation, settings persistence, Android Back, board geometry and game rules. AI difficulty only for AI mode. No new asset spend, GitHub Actions or paid build capacity. P2 implementation and device QA pending.

## P2.2 — Quick Play responsive layout and typography (2026-11-25)

Owner approved progression from P2.1 concept by requesting continuation. Source candidate: isolated src/neon-p22-quick-layout.css (b266106), imported after frozen Home styles (98924b7), two focused source tests (6c34cd8). Visible Core Neon Quick Play only: centered title, dedicated 70x44 Back slot, 2/4/3-column groups, larger labels and mode choices, flexible preview area, full-width launch action, compact portrait and two-column landscape variants. Explicitly hide AI difficulty in PvP. Preserve all existing HTML controls and JS game/save/selection/navigation logic; main.js change is CSS import only. Normal portrait intended to fit without scrolling; vertical overflow remains available on very short screens or enlarged text so launch stays reachable. No Home stylesheet/markup changes, new art, credits, Actions or paid builds. Six source checks passed (selector scope, import, hidden state, Home isolation, compact, landscape); full Node suite (expected 265 tests), computed layout and Android QA pending. Next P2.3 glass material, then P2.4 board preview and P2.5 motion, one combined P2.6 build.

## P2.3 — Quick Play Premium Glass Buttons (2026-11-25)

Source implemented: src/neon-p23-quick-glass.css (ea271f8), imported after P2.2 (c7e4e01), two focused regression tests (b3ddc8f). Visible Core Neon Quick Play only, including Back, mode/size/difficulty selectors and Start Match. Existing neonControls cascade layer and pseudo-elements reused; cyan secondary glass, violet selected options with check mark, brighter violet launch, diagonal facets, inset highlights, distinct keyboard focus, static active response and disabled dimming. No layout, Home, game rules, save, navigation, audio/haptics or asset changes; no new animations (P2.5 follows). Seven source checks PASS; full suite expected 267 tests, visual/computed-style and Android QA pending. No Picsart credits or GitHub Actions. Next P2.4 dynamic board preview, then P2.5 motion and combined P2.6 APK.

## P2.4 — Dynamic Board Preview (2026-11-25)

Implemented exact SVG miniatures for the four existing board sizes (fbf853f), scoped CSS (3e53e22, ec8e489), and higher 480x480 backing resolution for Core Neon setup preview using unchanged drawOpening/Renderer (d977887). Miniatures show 13/25/41/61 active cells, including four pre-owned tips; playable labels stay 9/21/37/57. Added decorative Arena preview heading, larger responsive preview, compact/landscape limits. Two source tests added (527c337). Source inspection confirms cell counts, two X and two O per miniature, stylesheet import and Home isolation; full suite expected 269 tests, actual Android visual quality, layout and performance pending. Existing board rules, save, navigation, Home and other skins unchanged; no new artwork, credits or Actions. Next P2.5 motion/feedback and combined P2.6 regression/Android QA.

## P2.5 — Animation & Interaction Polish (2026-11-25)

Implemented scoped Quick Play press feedback (984e1dc), CSS import and finite 180ms preview animation only when board size actually changes (21a2be1), with reduced-motion guard and cancellation of the prior preview animation. Existing screen-entry transition and global sound/haptic click handler retained, no duplicate feedback or delayed navigation. Corrected P2.3 base selector specificity so selected violet material can override it (a7b309f). Two source regression tests added (048a7c2); seven source checks passed. Full regression expected 271 tests; Android APK and actual motion/visual/audio verification pending. No Home changes, game rules, new art, Picsart credits or GitHub Actions. Next P2.6 combined manual Codemagic Cloud Test APK, verify Quick Play and frozen Home.

## P2.6 — Combined Quick Play regression and phone video QA (2026-11-26)

Evidence: run_regression_tests.log (7).txt — **271/271 PASS**, 0 failed/cancelled/skipped/todo, 3660.758ms; all eight P2 source tests 200–207 pass. Video 34744.mp4, 46.09s, 1080x2340, sequentially sampled. Home appears unchanged in recorded scenario. Quick Play (~8–24s) shows cyan secondary/violet selected material, all four sizes (9/21/37/57 playable cells), all three AI levels, preview updates and no visible Home overlay or clipping; 2 Players at ~22.5s hides AI level, returning to AI restores it. New game confirmation (~26s), return to setup (~30s), Grand AI game (~34s), Return to Home confirmation (~36–40s), Home/Career navigation (~41–44s). No full match/reward or local PvP match captured. No measured FPS, reduced-motion, smaller/landscape viewport, physical vibration or independently verified sound settings. Expected candidate 6e2a2d1; APK SHA not independently verified.

**Regression PASS; visual acceptance OPEN.** Review finds visually busy cyan/red arena background competes with preview, summary text over bright podium has weak separation, and grid/secondary labels merit contrast and legibility check on device. Recommend a limited P2.6a refinement (Quick Play only): restrained localized darkening/contrast, clearer preview summary, check actual renderer line readability, and keep board geometry, glass options, layout and frozen Home. No runtime changes in this QA record. Owner approval and next device test before freezing P2; P3 Career & Rivals follows. No new assets, Picsart credits or Actions.

## P2.6a–c — Approved Quick Play Final Polish (2026-11-26)

Owner approved the new Neon Tactical Arena background and stronger cyan/violet/red glass mockup. P2.6c scoped CSS is imported after P2.5. Codemagic asset import commit `67a1c8e` adds only `neon-tactical-arena-v1.webp` (~100 KB); the runtime uses local WebP and the package asset verifier includes it. Home remains frozen; no board geometry, saved choices, navigation or rules changed. Three additional source/asset tests added at `8e36783`; expected total 274, not yet run. Next P2.6d: manual Cloud Test APK, full regression, packaged asset hash verification, phone visual approval and frozen Home comparison. P2.7 freeze only after acceptance; P3 Career follows. No GitHub Actions or additional Picsart generation in implementation.

## Deferred — continuous first-launch presentation (owner feedback, 2026-11-26)

Keep Home frozen during Quick Play/Career work. Later revisit only the first-launch sequence: owner observes a perceptible pause between completed logo reveal and button appearance (video 34755.mp4). Preserve the approved two-light-point rhombus/logo and Home design; overlap the logo lighting, arena/podium reveal and UI entrance in one continuous timeline, with reduced-motion and no repeat on ordinary return to Home. Proposed timing and implementation remain subject to approval; no runtime changes now.

## P2.6d — Quick Play owner video review (2026-11-26)

Owner approves the new Tactical Arena background and reports a major visual improvement. Remaining blocker: vs AI setup requires vertical scroll on the test phone; Start Match must be fully visible without scrolling at normal text size (retain accessibility/compact-screen overflow fallback). Owner asks whether angular Home/Start Match-style corners and more distinctive Quick Play title typography would improve consistency. Proposed: modest chamfers on secondary options, stronger chamfers on CTA, coherent glass materials, restrained title styling; preserve exact board and all choices. These are proposals, not approved code changes. Quick Play freeze pending further approval and retest.

## P2.6e — Final Quick Play corrections / owner video review (2026-11-26)

Owner approved compact layout, angular controls, title styling, horizontal mode icons, selection light feedback and CTA sheen; keep Home and Tactical Arena background unchanged. Implementation at `5f41969`, `d62cc9b`, `22e0455`; four source tests at `4520bd4`. Video 34761.mp4 (34.57 s, 1080×2340) shows complete vs AI and local PvP setup including visible CTA, all four board sizes and all three difficulty options, matching chamfered controls and horizontal icons. No observed vertical displacement during recorded selection changes; deliberate drag test not independently established. CTA travelling sheen not clearly visible in 4 fps samples; selection impulse unverified. Local PvP starts after replacement confirmation; Return to Home and exit confirmation shown. Expected 278 tests, full log and APK source SHA not supplied. P2.7 freeze requires owner's visual acceptance and regression evidence. Deferred first-launch continuity and P3 Career remain separate.

## P2.7 — Quick Play visual freeze / P3 Career kickoff (2026-11-26)

Owner confirmed no scrolling on S24 Ultra after P2.6e, requested removal of selection tick and approved final optical refinements. P2.6f (`acc6632`, `9ba5282`, `1d29929`, `4937e2d`, `800b8f7`) adds local vector title, removes visual check (aria-pressed remains), preview glow, finite CTA sweep, and three source tests. Video 34763.mp4 (25.05 s, 1080×2340) and owner approval establish **Quick Play visual FROZEN**, baseline `800b8f7`. Expected regression 281; actual final test log and APK source SHA not supplied; keep technical gate open. Home remains frozen; deferred first-launch continuity unchanged.

## P3.1 — Career redesign discovery and concept (2026-11-26)

Existing Career uses sequential Levels / Mission / Rivals pages with previous/next navigation; Core presents six rivals across 30 levels (five per rival), while full campaign retains 100-level data. Proposed concept: direct three-tab navigation, prominent current rival and chapter progress, five clearly differentiated level choices, primary current mission action; preserve existing mission data, locked states, stars, profile persistence, rewards, confirmations and campaign limits. Verify Core labels, rival intervals and actual boss logic against source before altering presentation; do not assume full-mode ranges apply to Core. P3.1 concept/mockups first, P3.2 navigation, P3.3 levels/progress, P3.4 mission, P3.5 rivals, P3.6 combined regression and Android QA. Phase numbering proposed; no Career runtime changes yet. No Home/Quick Play changes or new Picsart spend without approval.

## P2.7 — Final regression gate PASS (2026-11-26)

Owner supplied `run_regression_tests.log (8).txt`: 281/281 PASS, 0 fail, 0 cancelled, 0 skipped, 0 todo; duration 4659.807584 ms. All P2.2–P2.6f checks (200–217), including final P2.6f checks 215–217, pass. Together with prior owner device confirmation of no scrolling and visual acceptance of video 34763.mp4, the Quick Play visual freeze and automated regression gate are complete. Log contains no source SHA; exact APK provenance is not independently established. No runtime changes; Home and Quick Play remain frozen; deferred startup continuity stays open. Proceed to P3.1 Career concept.

## P3.1 — Career visual concept approved (2026-11-26)

Owner explicitly approved the three-screen P3.1 Career mockup (Levels / Mission / Rivals) and requested faithful adherence to it. Treat its visual language as the design baseline: dark navy arena, cyan outlines and icons, violet active tab and primary action, angular glass panels, bold italic metallic headings, large readable level numerals, distinct completed/current/locked treatments, visible chapter and overall progress, compact portrait layout. Use the real existing six rival portraits and names (Rookie, Trickster, Predator, Phantom, Grandmaster, Omega), existing progression, actual stars and mission data; the mockup's illustrative rival names, extra coin reward amounts, mission objectives and chapter reward are not approved gameplay changes. Core remains 30 levels, full campaign 100; verify presentation against actual data. Home and Quick Play remain frozen (281/281 regression PASS); do not change backgrounds or shared game logic. Next P3.2 direct navigation, then P3.3 Levels and progress, P3.4 Mission, P3.5 Rivals, P3.6 QA. No new Picsart spend or GitHub Actions. No runtime changes in this approval record.

## P3.2 — Career direct navigation implementation (2026-11-26)

Implemented three direct Core Neon Career controls with real existing panes, aria-pressed state, guarded click handlers, and legacy navigation retained for other skins/editions. Existing Back and identity flow unchanged. Commits `41fef27`, `c735918`, `53a26d0`; three source regression tests `0ae0d16`. Expected 284 tests, not executed here. Home and Quick Play remain frozen. Next P3.3 Levels and Chapters; combined Android QA pending.

## P3.3 — Levels and Chapters implementation (2026-11-26)

Implemented chapter hero using existing local rival art, real five-level chapter completion, actual earned stars, five angular level tiles, overall progress and violet direct Play Level action. Both launch controls reuse the existing guarded confirmation/start path. Core Neon scoped layout with legacy fallback and narrow viewport accommodation. Commits `b47bd8e`, `4bdcc90`, `3225b00`, `0658333`, `775eda1`, `9efa7bf`, tests `90d21bc`. Expected 288 total tests; execution and Android visual QA pending. Home and Quick Play frozen. Owner explicitly permits Picsart use for useful Career artwork; no new artwork generated or credits spent in this step. Next P3.4 Mission, P3.5 Rivals, then combined QA. Preserve approved P3.1 mockup and existing game economy/rules.

## P3.4 — Mission cards revised to approved reference (2026-11-26)

Owner explicitly rejected the visible board-centric Mission composition and reaffirmed original P3.1 three-screen reference. Implemented five horizontal chapter-level mission cards, actual mission titles/clues (generic win objective where no authored mission exists), best-star progress, remaining XP opportunity from existing award formula, locked state, guarded selection, and violet chapter completion summary (no invented chapter payout). The original canvas and opening renderer remain for legacy skins; hidden only on Core Neon Mission. Existing guarded Play Level path retained. Commits `64ef5cf`, `3e02702`, `cdcfe8e`, `f00449e`, tests `1cc462e`. Expected regression 291; not executed. Android visual fit, selection, confirmation, XP display and legacy fallback pending. Home and Quick Play frozen. No additional Picsart credits used, no GitHub Actions. Next P3.5 Rivals with original six portraits and approved horizontal card design.

## P3.5 — Career Rivals integration (2026-11-26)

Six original local portraits in horizontal cards, real chapter completion indicators, distinct locked/completed/current states, Core five-level current-rival mapping corrected for Career without changing Home mapping. Landscape two-column fallback. Commits `554112f`, `7dd417d`, `8cb85bb`, `db8d566`; three source tests `f836a79`. Expected 294 total regression tests, not yet executed. Home and Quick Play remain frozen. Next P3.6 integrated Career visual ambience, motion and Android QA; no new Picsart assets or credits used in P3.5. Device fit and visual consistency with approved P3.1 reference remain pending.

## P3.6 — Career Command Center background (2026-11-26)

Owner authorized 2 Picsart credits. Seedream 5.0 Pro generated one 1504x2664 JPEG (311729 bytes), saved in Picsart Drive as career-background-2k.jpeg, UID ce20d536-f841-475a-944c-c5dfccb5b8dc. Source: https://gcdn.picsart.com/editing-temp/7456e531-468b-4756-bfcd-20f5530bbcc0.jpeg. Confirmed balance 655. Commits 47fc957, 94bc84b, b30687d, 0f235f4, eb51aae: Career-only CSS, one-item WebP import queue (max side 2048), scoped Codemagic staging, local/dist/Android asset verification, CSS activation. Home and Quick Play frozen; no game rules, economy, navigation, portraits or profile changes. **Pending binary import**: run manual RombMaster Picsart Asset Import on feat/android-closed-test-core, verify ASSET CONVERSION / ROMBMASTER_THEME_ASSETS / ASSET PUSH PASS and confirm tracked neon-career-command-v1.webp. Then run Cloud Test APK, expected existing 294 regression tests (not run here), verify actual device visuals of Levels/Mission/Rivals, offline rendering, readability, fit/scroll, navigation, and frozen Home/Quick Play. No GitHub Actions. Career is not yet QA-approved. No new motion in this background-only step.
