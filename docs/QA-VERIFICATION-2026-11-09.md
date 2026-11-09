# Step 15 — local verification, 9 November 2026

Base: `640f1df55649d7de315559da0c2fa0589e68d485` (step 14).
Test branch: `fix/step-15-verified-qa`.

## Correction

The full suite initially passed 97 of 98 tests. The hover test compared a
host-realm plain object with a VM-realm Board move using strict deep equality.
Their fields matched, but their prototypes differed. Copy both moves into
host-realm objects before comparison, retaining strict field comparison and
the existing checks for unchanged board/history and cleared hover on leave.
No gameplay logic changed.

## Executed checks

Linux, Node v24.22.1, npm 11.9.0, Vite 4.5.14:

- `npm ci --no-audit --no-fund`: passed (110 packages installed).
- `npm test`: 98 passed, 0 failed, 0 skipped after the correction.
- `npm run build`: passed (27 modules transformed).
- `npx --no-install cap sync android`: passed; web assets copied and three
  Capacitor plugins updated in the local Android project.

Tracked `dist` assets were regenerated from the current source. The QA script
and test-session instructions now target this branch, so the Windows run
includes the correction. See `QA-TEST-SESSION-2026-11-10.md` for commands.

## Remaining verification

No Android SDK or PowerShell runtime is available in this environment.
Gradle APK compilation, execution of the Windows QA script, APK installation,
visual checks and physical-device lifecycle/touch testing remain unverified.
Capacitor sync is not proof of a successful Android build.

Dependency installation reported a deprecated tar 6.x dependency; Capacitor
reported deprecated bundledWebRuntime configuration. Dependency modernization
remains a separate release task; this pass is not a security audit or Play
Store eligibility check.

No GitHub Actions, merges to main, installation or publication were performed.
