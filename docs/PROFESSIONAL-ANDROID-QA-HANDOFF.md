# RombMaster — Step 21 full-device QA handoff

**Candidate:** `feat/step-21-player-comfort-qa` stacked on Step 20, Step 19 and earlier Draft PRs.

**Do not merge any Draft PR and do not install an Android APK unless the web and Android stages report PASS.** These are source changes; passing this instruction does not certify Google Play readiness.

## 1. Fresh, isolated Windows 11 checkout

Open Windows PowerShell, keep your existing RombMaster directory and production app untouched.

```powershell
New-Item -ItemType Directory -Path 'C:\RombMaster-QA' -Force | Out-Null
Set-Location 'C:\RombMaster-QA'
git clone --branch feat/step-21-player-comfort-qa --single-branch https://github.com/Aleksandar1105/RombMaster.git RombMaster-Professional-Test
Set-Location '.\RombMaster-Professional-Test'
git status --short
git branch --show-current
```

If the test folder already exists, choose a **new empty folder name** instead of deleting it. `git status --short` must be empty.

## 2. Web checks: mandatory stop gate

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\qa-local.ps1 -WebOnly
```

The script verifies the isolated Android application ID, performs `npm ci`, `npm test` and `npm run build`, and creates `qa-logs\qa-summary-*.txt`.

**STOP if any step fails.** Do not merge, sync or install on failure.

## 3. Build Android APK without installing

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\qa-local.ps1
```

It uses a compatible local JDK and Android SDK, runs tests, syncs Capacitor and creates the local debug APK. It prints a SHA256 hash and leaves the existing installed production application untouched.

Expected output after successful Gradle build:
`android\app\build\outputs\apk\debug\app-debug.apk`

If JDK or SDK detection fails, inspect the displayed reason. Use `-JdkHome` or `-SdkPath` only with the actual locally installed directories.

## 4. Device test — explicit opt-in only

After stages 2 and 3 PASS, connect an Android phone by USB with USB debugging authorized. Ensure it is your test phone, then run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\qa-local.ps1 -InstallDebug
```

The debug build is installed as `com.rombmaster.game.test`, separate from `com.rombmaster.game`. If multiple devices are connected, use `-DeviceSerial` with the actual `adb devices` serial.

## 5. Real-device checklist

- [ ] App opens, premium home displays fully on a small screen and scrolls without covering actions
- [ ] Continue is shown only for a valid saved match
- [ ] Quick Play 4/6/8 boards, PvP, Casual/Smart/Master AI all draw and accept accurate taps
- [ ] Career stages and AI captures, chain decisions and extra turns work without lag
- [ ] Undo, restart confirmation, back button and switching apps preserve correct state
- [ ] Profile switch does not move a saved game to another local player
- [ ] Daily Brain Challenge updates today's solved count once; reopening does not reward twice
- [ ] Sound and haptic preferences work, survive restart, and do not break offline play
- [ ] Tutorial, large font, safe area, rotation and reduced motion are usable
- [ ] No crash, white screen, unexpected app exit, frozen AI or missing board
- [ ] Test APK uses package ID `com.rombmaster.game.test`, production install remains intact

Collect screenshot/video and the QA summary. Report PASS, FAIL or BLOCKED per check and the phone model/Android version. No real-device PASS should be assumed before the user supplies evidence.

## 6. Decision gate

Only after all required checks are documented PASS, review the stacked Draft PRs in order and then consider merges. Real-user testing and monetization are separate later stages. Do not enable payments or ads during this QA run.
