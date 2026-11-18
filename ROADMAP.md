# RombMaster — Roadmap to V30.0

Updated: 2026-11-18. Active branch: `feat/v25-royal-master`.
Goal: a commercial production release for Google Play.

## Provenance and authority

This document restores the November 18 conversation plan, reconciled with source
at `11433fcd6a8600e8cb8daddf02fd130f510f81c6`. Earlier plans in
`docs/RELEASE-ROADMAP.md` and `docs/PROFESSIONAL-GAME-ROADMAP.md` are historical:
their old step numbers are not the current V25–V30 milestones.
V25–V28.5 and the 16-skin list were recovered from the prior discussion.
The exact agreed V29/V30 phase text was not recovered. The rows below explicitly
separate a proposed V29 work package from the user-confirmed V30 release goal;
do not represent the proposed scope as an earlier approval.

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
| V29 | Proposed: release hardening, Android compatibility, performance, accessibility, store assets, privacy and release testing | Exact prior phase scope missing; obtain owner decision before committing to this phase. Verify current official Play requirements when approaching release. |
| V30.0 | Commercial production version for Google Play | User-confirmed destination. Requires approved visuals, device QA, release signing/versioning, Play requirements, accurate disclosures, tested monetization and explicit publication approval. Exact prior subphase text still missing. |
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
