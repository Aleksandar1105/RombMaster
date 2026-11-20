# RombMaster — QA status

Updated: 2026-11-18. Application baseline: `11433fc`, V25.2.2 Royal Gold Master.
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
