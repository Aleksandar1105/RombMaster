# RombMaster — Roadmap to V30.0

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
