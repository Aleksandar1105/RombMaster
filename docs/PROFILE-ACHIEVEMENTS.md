# Step 12 — local profile, avatars, Career statistics and achievements

This feature expands the existing **offline, optional** player profile. It is
not an account, sign-in provider, online identity, or ranked leaderboard.

## Player experience

- The player can choose one of six included emoji avatars. No image upload,
  camera, real name or account is required.
- The existing 1–18 character nickname remains editable.
- Expand **Career statistics & achievements** in the main menu to inspect:
  Career matches, wins, draws, losses, win percentage, current/best winning
  streak, distinct stages cleared, and best stars earned (maximum 90).
- Seven achievements are based on Career data: first win, five wins, three
  consecutive wins, ten stars, unlocking level 11, unlocking level 21,
  and completing level 30.
- New achievements are announced in the post-match result. No coins,
  transactions, advertising or backend dependencies were introduced.
- Quick AI and local pass-and-play PvP do **not** increase Career statistics.
  Their tracking should be a separately consented/defined future feature.

## Storage and backwards compatibility

- Uses the existing key `rombmaster_profile_v1`. Save format version stays
  `1`, and old profiles without `avatar`, `streak` or `bestStreak`
  load with the safe defaults `spark`, `0` and `0`.
- The reader validates that avatars are from the included presets and that
  counters and streaks are internally consistent. Unknown or malformed data
  is preserved, not silently reset. Existing XP, levels, stars and wins are
  retained when the user updates a name/avatar.
- Achievements are **derived** from validated statistics on every read;
  they are not stored as independent mutable flags. Newly unlocked entries
  are calculated only on a successfully persisted Career result.
- Statistics are local and unverified. Device uninstall, app data deletion,
  device replacement, or storage errors can lose them. Cloud restore and
  online rating must later use separate account and trust models.
- The previous Career match save and Undo implementation are unchanged.
  There is no server sync, analytics SDK, Android permission, or network call.

## Manual acceptance checks (still required)

1. Load an older Career profile and verify stars, XP and completed stages stay
   unchanged; select each avatar and reopen the app.
2. Finish a Career match and verify exactly one result/statistical update and
   an achievement announcement only when its threshold is first crossed.
3. Revisit already completed levels: replaying a win may count as another
   Career match but must not duplicate a new achievement unlock.
4. Draw or lose a Career match: current streak returns to zero but best
   remains. Test win rate including draws/losses.
5. Open menu, close/reopen the statistics panel, and check smaller Android
   displays and large accessibility font settings.
6. Run `npm test`, `npm run build`, local Android debug APK compilation,
   and physical phone tests before merging this draft PR.
7. Confirm corrupt/unsupported profiles remain untouched and trigger an
   appropriate warning rather than being overwritten.
