# RombMaster QA preflight - runs locally on Windows, never starts GitHub Actions.
# Use a clean, disposable clone of feat/step-21-player-comfort-qa.
[CmdletBinding()]
param(
    [switch]$WebOnly,
    [switch]$InstallDebug,
    [string]$DeviceSerial = "",
    [string]$JdkHome = "",
    [string]$SdkPath = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$expectedBranch = "fix/step-15-input-scale-stability"
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


# Read Java version through .NET Process, because Java reports -version on
# stderr and Windows PowerShell 5.1 treats redirected native stderr as errors.
function Get-JdkVersion([string]$jdkPath) {
    # $HOME is a read-only automatic variable in Windows PowerShell 5.1.
    # A parameter named $home throws before this function can run.
    $javaExe = Join-Path $jdkPath "bin\java.exe"
    $javacExe = Join-Path $jdkPath "bin\javac.exe"
    if (-not (Test-Path -LiteralPath $javaExe) -or
        -not (Test-Path -LiteralPath $javacExe)) { return $null }

    $start = New-Object System.Diagnostics.ProcessStartInfo
    $start.FileName = $javaExe
    $start.Arguments = "-version"
    $start.UseShellExecute = $false
    $start.RedirectStandardError = $true
    $start.RedirectStandardOutput = $true
    $p = New-Object System.Diagnostics.Process
    $p.StartInfo = $start
    try {
        if (-not $p.Start()) { return $null }
        $stderrText = $p.StandardError.ReadToEnd()
        $stdoutText = $p.StandardOutput.ReadToEnd()
        $p.WaitForExit()
        if ($p.ExitCode -ne 0) { return $null }
        $info = $stderrText + $stdoutText
        $match = [regex]::Match($info, '(?i)(?:openjdk|java)\s+version\s+"(\d+(?:[._]\d+)*)')
        if (-not $match.Success) { return $null }
        $parts = $match.Groups[1].Value -split '[._]'
        $major = [int]$parts[0]
        if ($major -eq 1 -and $parts.Length -gt 1) { $major = [int]$parts[1] }
        return [pscustomobject]@{ Home = $jdkPath; Major = $major; Version = $match.Groups[1].Value }
    } finally {
        $p.Dispose()
    }
}

function Select-BuildJdk {
    $candidates = New-Object System.Collections.Generic.List[string]
    if ($JdkHome) {
        $candidates.Add($JdkHome)
    } else {
        if ($env:JAVA_HOME) { $candidates.Add($env:JAVA_HOME) }
        if ($env:ProgramFiles) {
            $candidates.Add((Join-Path $env:ProgramFiles "Android\Android Studio\jbr"))
            foreach ($folder in @("Eclipse Adoptium", "Java", "Microsoft")) {
                $base = Join-Path $env:ProgramFiles $folder
                if (Test-Path -LiteralPath $base) {
                    foreach ($child in Get-ChildItem -LiteralPath $base -Directory -ErrorAction SilentlyContinue) {
                        $candidates.Add($child.FullName)
                    }
                }
            }
        }
        $java = Get-Command "java.exe" -ErrorAction SilentlyContinue
        if ($java) {
            $binPath = Split-Path $java.Source -Parent
            $candidates.Add((Split-Path $binPath -Parent))
        }
    }

    $seen = @{}
    $found = @()
    foreach ($candidate in $candidates) {
        if (-not $candidate) { continue }
        $resolved = $candidate.TrimEnd([char[]]@('\', '/'))
        if ($seen.ContainsKey($resolved)) { continue }
        $seen[$resolved] = $true
        try {
            $jdk = Get-JdkVersion $resolved
            if ($jdk) {
                Record "FOUND JDK candidate: $($jdk.Version) at $($jdk.Home)"
                if ($jdk.Major -eq 17 -or $jdk.Major -eq 21) {
                    $found += $jdk
                }
            }
        } catch {
            Record "SKIP invalid Java candidate: $resolved ($($_.Exception.Message))"
        }
    }
    if ($found.Count -eq 0) {
        throw "JDK 17 or 21 was not found. Java 8 cannot build this Android project. Install JDK 17 or use -JdkHome 'C:\Path\To\jdk-17'. No Java installations were changed."
    }
    # Prefer Java 17 over 21 for the older Capacitor 5 / AGP 8.0 toolchain.
    $chosen = $found | Sort-Object @{ Expression = { if ($_.Major -eq 17) { 0 } else { 1 } } } | Select-Object -First 1
    $env:JAVA_HOME = $chosen.Home
    $env:PATH = (Join-Path $chosen.Home "bin") + ";" + $env:PATH
    Record "PASS: using JDK $($chosen.Version) at $($chosen.Home) (this PowerShell process only)"
}

# Gradle requires an Android SDK location. Discover it from this machine
# without writing local.properties or changing persistent Windows settings.
function Select-AndroidSdk {
    $propertiesFile = Join-Path $root "android\local.properties"
    if (Test-Path -LiteralPath $propertiesFile) {
        if ($SdkPath) {
            throw "Both android\local.properties and -SdkPath were supplied. Remove the conflict manually; the script will not overwrite local.properties."
        }
        Record "NOTICE: android\local.properties already exists. Leaving the SDK configuration unchanged."
        return
    }

    $candidates = New-Object System.Collections.Generic.List[string]
    if ($SdkPath) {
        $candidates.Add($SdkPath)
    } else {
        if ($env:ANDROID_HOME) { $candidates.Add($env:ANDROID_HOME) }
        if ($env:ANDROID_SDK_ROOT) { $candidates.Add($env:ANDROID_SDK_ROOT) }
        if ($env:LOCALAPPDATA) {
            $candidates.Add((Join-Path $env:LOCALAPPDATA "Android\Sdk"))
        }
        if ($env:USERPROFILE) {
            $candidates.Add((Join-Path $env:USERPROFILE "AppData\Local\Android\Sdk"))
        }
    }

    $seen = @{}
    foreach ($candidate in $candidates) {
        if (-not $candidate) { continue }
        $location = [Environment]::ExpandEnvironmentVariables($candidate).Trim().Trim('"')
        if (-not (Test-Path -LiteralPath $location -PathType Container)) {
            Record "SKIP missing Android SDK candidate: $location"
            continue
        }
        $resolved = (Resolve-Path -LiteralPath $location).Path.TrimEnd([char[]]@('\', '/'))
        if ($seen.ContainsKey($resolved)) { continue }
        $seen[$resolved] = $true

        $markers = @("platforms", "platform-tools", "build-tools", "cmdline-tools", "tools")
        $isSdk = $false
        foreach ($marker in $markers) {
            if (Test-Path -LiteralPath (Join-Path $resolved $marker) -PathType Container) {
                $isSdk = $true
                break
            }
        }
        if (-not $isSdk) {
            Record "SKIP Android SDK candidate without SDK components: $resolved"
            continue
        }

        $env:ANDROID_HOME = $resolved
        $env:ANDROID_SDK_ROOT = $resolved
        Record "PASS: Android SDK found at $resolved (this PowerShell process only)"
        $platformJar = Join-Path $resolved "platforms\android-33\android.jar"
        if (-not (Test-Path -LiteralPath $platformJar)) {
            Record "NOTICE: Android SDK Platform 33 is not installed here. If Gradle cannot download it, open Android Studio SDK Manager and install Android API 33 (and build tools)."
        }
        return
    }

    throw "Android SDK location not found. Open Android Studio > Tools > SDK Manager, install Android SDK Platform 33 and SDK Build-Tools, then rerun. For a non-default location use -SdkPath 'C:\Actual\Android\Sdk'. No global Windows settings were changed."
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
        Select-BuildJdk
        Select-AndroidSdk
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
    Record "FINAL STATUS: STOPPED - $($_.Exception.Message)"
    throw
} finally {
    $results | Set-Content -LiteralPath $summaryFile -Encoding UTF8
    Pop-Location
    Write-Host "QA summary: $summaryFile"
}
