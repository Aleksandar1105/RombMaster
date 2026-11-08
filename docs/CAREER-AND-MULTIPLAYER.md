# RombMaster — player identity, career progression and multiplayer architecture

## Scope of step 9 (implemented, pending local tests)

- Optional **local player name**, 1–18 visible characters; no account needed.
- Separate versioned profile at `localStorage['rombmaster_profile_v1']`.
- Career: 30 unlockable stages. Stages 1–10 use the existing small board
  and `easy` AI; 11–20 classic and `normal`; 21–30 large and `hard`.
  **These are three existing AI tiers, not 30 unique AI strengths.** Progressive
  within-tier intelligence and additional objectives are later balance work.
- First victory at a stage unlocks the next; at stage 30 the catalog ends.
- One to three stars by win margin: any victory = 1; >=20% = 2; >=40% = 3.
  XP is awarded only for increasing the best stars at that stage:
  50 XP per new star + 50 XP on first clear. Replaying the same best result
  increases win statistics but not XP.
- Draw/loss statistics are recorded but do not unlock progression.
- Profile and current saved match are separate. Quick AI and local two-player
  modes remain available; they do not change career progression.
- Career match settings optionally include `careerLevel` in v1 move-log saves.
  Existing v1 saves without a career level and verified legacy migrations are
  still accepted. No backend, auth SDK, ads or analytics introduced.
- The completion result is persisted at the **final board move**, before the
  result overlay delay; the overlay reads the existing outcome rather than
  recording it again. The Next Level button appears only after a stored win.
- Missing profile => guest defaults. Unsupported/corrupt profile => do not
  overwrite; recovery/reset requires an explicit future user-facing flow.
  Storage failure => no success claim; users are warned that progress did
  not save.

## Profile model (local, untrusted)

```json
{
  "version": 1,
  "name": "Player",
  "xp": 0,
  "unlockedLevel": 1,
  "stars": {},
  "stats": { "played": 0, "wins": 0, "draws": 0, "losses": 0 }
}
```

The profile is **not a verified online identity** and can be edited on-device.
Offline XP/stats must never be imported as authoritative ranked match data.

## Planned play modes

1. **Career vs AI:** offline, unlocked levels, board difficulty and stars.
2. **Quick AI:** size and AI difficulty chosen freely, no career gating.
3. **Local PvP:** two people on one device, no account or internet. Presently
   called `pvp` in settings (not peer-to-peer networking).
4. **Online Casual:** match with another active human. Optional account linking
   should become available here; never advertise online play until networking,
   presence, reconnection and validation are implemented.
5. **Online Ranked (later):** rating-based matchmaking, anti-cheat policy,
   ranking seasons, disconnect/forfeit rules and verified stats.

## Online architecture proposal (not yet implemented)

- Start offline/guest-first. Add optional sign-in through a supported identity
  provider when cloud sync and online play are introduced.
- A user-visible account linking/migration flow must handle device replacement,
  duplicate identities, local profile merge conflicts, deletion and recovery.
- Server owns ranked/online match state: player assignment, initial board,
  whose turn, legal moves, captures, score, end result and match history.
  Client-submitted results or offline XP are never trusted for ranked play.
- Realtime channel broadcasts committed moves with monotonic sequence numbers.
  Duplicate, late or out-of-turn submissions must be rejected.
- Matchmaking queue, mutually confirmed game room, presence, timeout, reconnect
  token, abandon/forfeit and rematch rules must be tested under network loss.
- Plan privacy policy, retention/deletion, moderation and player-name safety,
  including the age groups the game is intended for, before online rollout.
- Estimate backend, concurrency and abuse costs before selecting hosted service.
  Prototype with private two-player rooms before public matchmaking.

## Acceptance gates for this feature

- `npm test`, `npm run build`, Android debug APK build and real-device tests.
- Create and edit profile, reject invalid names, reopen/reinstall behavior,
  unlock levels, replay results, XP/stars and maximum stage.
- Continue/Undo, restart, Back/menu, background process death and result delay.
- Corrupted/unsupported local storage must not be silently overwritten.
- Landscape/short-screen layout, accessibility and scrolling.
- Compare difficulty and first-time comprehension with real testers.

This is a feature branch stacked on step 8, not an approved Play Store release.
