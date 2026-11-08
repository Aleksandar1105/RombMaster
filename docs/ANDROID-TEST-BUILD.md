# Step 7 — isolated Android test install (without GitHub Actions)

This branch is stacked on `fix/step-6-app-lifecycle`; merge/rebase earlier PRs
in order before considering release. **No CI workflow, Play Console upload, or
signed release is introduced here.**

## Identifiers and data safety

- **Production / existing Android app ID:** `com.rombmaster.game`.
  Do not change this ID as a side effect of renaming the app, or Android would
  treat it as another app and existing local game data would not be shared.
- Capacitor's `appId` now matches this existing native Android ID.
- **Debug APK app ID:** `com.rombmaster.game.test`, via Gradle
  `applicationIdSuffix ".test"`. The Java/Kotlin namespace and MainActivity
  package remain `com.rombmaster.game`; this is intentional.
- **Debug launcher label:** `RombMaster Test`; release launcher label:
  `RombMaster`.
- Debug and production installations have separate app storage (local saved
  games, preferences and Undo history). **A new debug install will NOT import
  a production save.** Never uninstall the original app to test this branch.
- A debug APK is **not** a release AAB, and is **not suitable for Play Store
  publication**. Do not sign a release or publish anything in this step.

## Build locally on Windows (only when Android SDK is available)

Prerequisites: Git, Node.js and npm; Android Studio and Android SDK; compatible
JDK for the project's Gradle/Android Gradle Plugin. Check the installed
versions before attempting broader Android tooling upgrades.

Open PowerShell in the repository:

```powershell
git switch chore/step-7-android-test-build
npm ci
npm test
npm run build
npx cap sync android

cd android
.\gradlew.bat assembleDebug
```

If successful, install the generated
`android/app/build/outputs/apk/debug/app-debug.apk` on a test device using
Android Studio or, after enabling developer USB debugging:

```powershell
adb install -r .\app\build\outputs\apk\debug\app-debug.apk
```

The test installation should appear as **RombMaster Test** beside any original
**RombMaster** installation. `adb install -r` replaces the *test* app when its
application ID matches and its signing certificate permits an update.

Do not commit APKs, AABs, keystores or Gradle build outputs. The existing
`android/.gitignore` excludes generated APK/AAB files.

## Required real-device acceptance checks

Check a typical Android phone and, if possible, a smaller display:

1. Open test app; confirm test name, game layout, and no overlap with status
   and navigation bars. Verify touch targets and 4x4 / 6x6 / 8x8 boards.
2. Play full PvP and AI matches at easy, normal and hard levels. Each tap
   must make at most one move; Undo must restore legal state.
3. Make several moves, exit to menu, close and reopen; use Continue. Check
   scores, turn, last move and Undo history.
4. Lock/unlock and switch apps during the AI delay and near completion.
   Confirm no hidden move, duplicate AI turn or delayed audio.
5. Press Android Back in help, result, board and menu. Confirm correct
   navigation and exit only from the menu.
6. Force-stop the test app, reopen it and use Continue. A force-stop is
   **not** expected to resume in-memory timers.
7. Confirm that test and original installations can coexist; game progress
   is separate, and the original app and its saves are untouched.

Record phone model, Android version, result and any reproducible issue.
Physical-device checks remain **unverified until performed**. Report failed
`npm test`, `npm run build` or Gradle output rather than assuming success.

## Later (not this PR)

Review current Google Play target API policy, upgrade the older Capacitor and
Android toolchain in a separately tested change, confirm a permanent package
name before first publication, prepare release signing and an AAB, and meet
the applicable Play testing and store listing requirements.
