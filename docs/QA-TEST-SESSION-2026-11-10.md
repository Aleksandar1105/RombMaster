# RombMaster — local QA / test session (10 November 2026)

**Target:** `fix/step-15-input-scale-stability`, which is stacked on
`feat/step-13-daily-brain-challenge`. This branch contains all proposed
steps 1–13, the input-coordinate fix, and the local preflight script, **without merging any Draft PR
into `main`**.

## Preparation — Windows 11

Keep your existing project directory and any existing app installation.
Open **PowerShell** and create a **separate fresh clone** in a test folder:

```powershell
New-Item -ItemType Directory -Path 'C:\RombMaster-QA' -Force | Out-Null
Set-Location 'C:\RombMaster-QA'
git clone --branch fix/step-15-input-scale-stability --single-branch https://github.com/Aleksandar1105/RombMaster.git RombMaster-Test
Set-Location '.\RombMaster-Test'
git status --short
```

The repository is public, so this does not need your GitHub account
password. Do not run `git pull` in your production project, and do not
delete existing Android app data.

**Requirements:** Node.js and npm, Git, Android Studio with Android SDK,
compatible JDK (typically 17 for AGP 8.0), and enough disk space for
Gradle and Android SDK dependencies. First-time dependency downloads require
internet access. Gradle may need appropriate SDK packages. Android Studio
can install missing SDK components. This repository currently has Capacitor 5
and an older target SDK; QA does not certify current Play Store eligibility.

## Stage A — web/game tests, no Android SDK required

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\qa-local.ps1 -WebOnly
```

This runs `npm ci`, `npm test` and `npm run build`. Any failure
**stops** the procedure. Review the corresponding `qa-logs\*.log` and
`qa-summary-*.txt`. Do not proceed to the Android install after failure.

## Java/JDK preflight

For Android Gradle Plugin 8.0, use **JDK 17** (preferred). Windows may
still have Java 8 on PATH, which is not sufficient. The QA script now
checks JAVA_HOME, Android Studio's bundled JDK (`jbr`), common JDK
installation folders and PATH. It selects a compatible JDK **only in
its own PowerShell process**, without uninstalling or reconfiguring
system Java.

If it reports no usable JDK, install a trusted JDK 17 distribution and
run the same script with an explicit JDK directory:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\qa-local.ps1 -JdkHome 'C:\Program Files\Eclipse Adoptium\jdk-17'
```

Use the actual directory containing `bin\java.exe` and
`bin\javac.exe`. The example location is not guaranteed to exist.
Do not install APK until `gradle-assemble-debug` passes.

## Stage B — generate test Android APK, still do not install

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\qa-local.ps1
```

Runs the same tests, then Capacitor sync and Gradle `assembleDebug`.
Output:

```text
C:\RombMaster-QA\RombMaster-Test\android\app\build\outputs\apk\debug\app-debug.apk
```

Gradle may download dependencies. **Never share or commit signing keys**.
Do not run `assembleRelease` or publish to Play Store.

## Stage C — optional installation on the test phone

First, confirm **USB debugging**, an authorized device, and a successful APK
build. With exactly one connected Android phone:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\qa-local.ps1 -InstallDebug
```

This re-runs tests before `adb install -r`. If two devices are connected,
provide `-DeviceSerial 'YOUR-ADB-SERIAL'`. The debug APK identifier is
`com.rombmaster.game.test`, separate from the existing
`com.rombmaster.game`. An installed debug app is replaced only if
its signing identity is compatible; otherwise stop and inspect before
uninstalling anything. **Never uninstall the original app to fix QA.**

Alternatively install the previously generated APK manually from Android
Studio or the handset's file manager, if device security settings permit.

## Physical test matrix

Record Pass/Fail, Android version, screen size/model, and a screenshot/short
description for failures. Do not mark untested cases as passed.

| Area | Required check |
| --- | --- |
| Install | Two apps can coexist; test launcher says `RombMaster Test` |
| Menu | All controls visible/scrollable on small screen and landscape |
| Quick AI | Start small/classic/large and Casual/Smart/Master; complete a match |
| PvP | Alternate legal moves; each tap causes at most one line |
| Controls | Tap near a dot, midline, away from board; test hover with mouse if available |
| Undo | Quick AI multi-step; PvP one line; Career only one last-human-decision rewind |
| Career | Create profile, avatar, win level 1, unlock level 2, verify XP/stars |
| Achievements | First Victory once, stats and win percentage remain consistent |
| Persistence | Save/Continue, menu/Back, force-stop/reopen, no duplicated AI move |
| Tutorial | Four steps, Back, no effect on match or Career progress |
| Daily | 3 puzzles, wrong answers/retries, exactly 30 Brain Points, reopen midway |
| Android lifecycle | Lock/unlock, background while AI thinks and after capture |
| Results | Winner/score, Play Again, Next Career Level, return to menu |
| Display | Safe areas/notch, zoom/font scale, keyboard focus, tall/short/landscape |
| Performance | AI Master on large board responsive; no stalled touches or overheating |

**Important limitations**: Daily mode and achievements are local, not a
server-verified ranking. Google Play policy, accessibility and public
release testing remain future steps.

## What to send back after running

Copy the final `QA summary` block, plus the **first failing log** if any.
Also share which test phone and Android version were used. If the first
stage fails, do **not** bypass the tests to install the APK.

### Actions/storage cost

No GitHub Actions workflows or runners are started by this script.
Dependencies, Gradle caches and APK are built entirely on your own PC.
`qa-logs` contains only locally generated logs; do not commit it.
