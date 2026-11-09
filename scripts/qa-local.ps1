# RombMaster QA preflight — runs locally on Windows, never starts GitHub Actions.
# Use a clean, disposable clone of chore/step-14-qa-android-preflight.
[CmdletBinding()]
param(
    [switch]$WebOnly,
    [switch]$InstallDebug,
    [string]$DeviceSerial = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$expectedBranch = "chore/step-14-qa-android-preflight"
$logDir = Join-Path $root "qa-logs"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$summaryFile = Join-Path $logDir "qa-summary-$stamp.txt"
$results = New-Object System.Collections.Generic.List[string]

function Record([string]$message) {
    $script:results.Add($message)
    Write-Host $message
}
function Require-Command([string]$name) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        throw "MISSING TOOL: $name. Install it and rerun in this same disposable clone."
    }
}
function Run-Step([string]$name, [scriptblock]$action) {
    $logFile = Join-Path $script:logDir ("$script:stamp-" + ($name -replace '[^a-zA-Z0-9-]', '-') + ".log")
    Record "RUN: $name"
    $before = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $global:LASTEXITCODE = 0
        & $action 2>&1 | Tee-Object -FilePath $logFile
        $code = $global:LASTEXITCODE
    } finally {
        $ErrorActionPreference = $before
    }
    if ($code -ne 0) {
        Record "FAIL: $name (exit code $code). Log: $logFile"
        throw "QA STOP: $name failed; no APK should be installed."
    }
    Record "PASS: $name"
}

Push-Location $root
try {
    Require-Command "git"
    Require-Command "node"
    Require-Command "npm.cmd"
    $branch = (& git branch --show-current).Trim()
    if ($LASTEXITCODE -ne 0 -or $branch -ne $expectedBranch) {
        throw "STOP: Expected $expectedBranch, found '$branch'. Do not switch your production repo."
    }
    $sha = (& git rev-parse HEAD).Trim()
    $node = (& node --version).Trim()
    $npm = (& npm.cmd --version).Trim()
    Record "RombMaster TEST BRANCH: $branch"
    Record "Commit: $sha"
    Record "Node: $node | npm: $npm"
    Record "Machine date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')"

    $config = Get-Content (Join-Path $root 'capacitor.config.json') -Raw | ConvertFrom-Json
    $gradleText = Get-Content (Join-Path $root 'android/app/build.gradle') -Raw
    if ($config.appId -ne "com.rombmaster.game" -or
        $gradleText -notmatch 'applicationId\s+"com\.rombmaster\.game"' -or
        $gradleText -notmatch '(?s)debug\s*\{[^}]*applicationIdSuffix\s+"\.test"') {
        throw "STOP: production/test Android IDs are not isolated as expected."
    }
    Record "PASS: production com.rombmaster.game remains separate from debug com.rombmaster.game.test"

    Run-Step "npm-ci" { & npm.cmd ci }
    Run-Step "node-tests" { & npm.cmd test }
    Run-Step "vite-web-build" { & npm.cmd run build }

    if (-not $WebOnly) {
        Require-Command "npx.cmd"
        Require-Command "java"
        Record "Java runtime (verify JDK 17 compatibility with Android Gradle Plugin):"
        & java -version 2>&1 | Out-Host
        Run-Step "capacitor-sync" { & npx.cmd --no-install cap sync android }

        Push-Location (Join-Path $root "android")
        try {
            Run-Step "gradle-assemble-debug" { & .\gradlew.bat --no-daemon assembleDebug }
        } finally {
            Pop-Location
        }

        $apk = Join-Path $root "android/app/build/outputs/apk/debug/app-debug.apk"
        if (-not (Test-Path -LiteralPath $apk)) { throw "STOP: Gradle reported success but the debug APK is missing." }
        $apkInfo = Get-Item -LiteralPath $apk
        $apkHash = (Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash
        Record "APK: $apk"
        Record "APK size: $($apkInfo.Length) bytes | SHA256: $apkHash"
        Record "This is a DEBUG test APK, not a Play Store release."

        if ($InstallDebug) {
            Require-Command "adb"
            if ($DeviceSerial -eq "") {
                $connected = @((& adb devices) | Where-Object { $_ -match "^[^\s]+\s+device\s*$" })
                if ($connected.Count -ne 1) {
                    throw "STOP: Connect exactly one authorized test phone, or rerun with -DeviceSerial."
                }
                Run-Step "adb-install-test" { & adb install -r $apk }
            } else {
                Run-Step "adb-install-test" { & adb -s $DeviceSerial install -r $apk }
            }
            Record "Test app installed (if adb PASS). Original com.rombmaster.game is not targeted."
        } else {
            Record "Installation deliberately skipped. Run again with -InstallDebug ONLY when ready."
        }
    } else {
        if ($InstallDebug) { throw "Cannot use -InstallDebug with -WebOnly." }
        Record "WEB-ONLY PASS: Android SDK/Gradle build was intentionally skipped."
    }

    Record "FINAL STATUS: completed requested QA stages."
} catch {
    Record "FINAL STATUS: STOPPED — $($_.Exception.Message)"
    throw
} finally {
    $results | Set-Content -LiteralPath $summaryFile -Encoding UTF8
    Pop-Location
    Write-Host "QA summary: $summaryFile"
}
