# Compounder Screener - Background Services Auto-Start Script
param(
    [switch]$OpenBrowser = $false
)

$rootDir = "D:\compounder-screener"
$backendDir = Join-Path $rootDir "backend"
$frontendDir = Join-Path $rootDir "frontend"
$logDir = Join-Path $rootDir "logs"
$logFile = Join-Path $logDir "startup.log"

if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

function Write-Log {
    param([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "[$timestamp] $message"
    Add-Content -Path $logFile -Value $entry -ErrorAction SilentlyContinue
    Write-Output $entry
}

Write-Log "--- Auto-Start sequence initiated ---"

# Explicit paths to binaries
$pythonExe = "C:\Program Files\Python313\python.exe"
if (-not (Test-Path $pythonExe)) {
    $pythonExe = (Get-Command python.exe -ErrorAction SilentlyContinue).Source
}

$nodeExe = "C:\Program Files\nodejs\node.exe"
if (-not (Test-Path $nodeExe)) {
    $nodeExe = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
}

# 1. Start FastAPI Backend (Port 8000)
$backendPort = 8000
$backendConn = Get-NetTCPConnection -LocalPort $backendPort -State Listen -ErrorAction SilentlyContinue

if ($backendConn) {
    Write-Log "FastAPI Backend is already running on port $backendPort."
} else {
    Write-Log "Launching FastAPI Backend on port $backendPort..."
    $backendOut = Join-Path $logDir "backend.log"
    $backendErr = Join-Path $logDir "backend_err.log"
    
    Start-Process -FilePath $pythonExe `
                  -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port $backendPort" `
                  -WorkingDirectory $backendDir `
                  -RedirectStandardOutput $backendOut `
                  -RedirectStandardError $backendErr `
                  -WindowStyle Hidden
    Write-Log "FastAPI Backend process spawned."
}

# 2. Start Vite Frontend (Port 5173)
$frontendPort = 5173
$frontendConn = Get-NetTCPConnection -LocalPort $frontendPort -State Listen -ErrorAction SilentlyContinue

if ($frontendConn) {
    Write-Log "Vite Frontend is already running on port $frontendPort."
} else {
    Write-Log "Launching Vite Frontend on port $frontendPort..."
    $viteScript = Join-Path $frontendDir "node_modules\vite\bin\vite.js"
    $frontendOut = Join-Path $logDir "frontend.log"
    $frontendErr = Join-Path $logDir "frontend_err.log"

    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = $nodeExe
    $processInfo.Arguments = "`"$viteScript`" --host 127.0.0.1 --port $frontendPort"
    $processInfo.WorkingDirectory = $frontendDir
    $processInfo.EnvironmentVariables["CI"] = "true"
    $processInfo.UseShellExecute = $false
    $processInfo.CreateNoWindow = $true
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true

    $viteProc = [System.Diagnostics.Process]::Start($processInfo)
    Write-Log "Vite Frontend process spawned (PID: $($viteProc.Id))."
}

# 3. Health check verification (wait up to 12 seconds)
$backendOk = $false
$frontendOk = $false

for ($i = 0; $i -lt 12; $i++) {
    Start-Sleep -Seconds 1
    if (-not $backendOk) {
        $conn = Get-NetTCPConnection -LocalPort $backendPort -State Listen -ErrorAction SilentlyContinue
        if ($conn) { $backendOk = $true }
    }
    if (-not $frontendOk) {
        $conn = Get-NetTCPConnection -LocalPort $frontendPort -State Listen -ErrorAction SilentlyContinue
        if ($conn) { $frontendOk = $true }
    }
    if ($backendOk -and $frontendOk) { break }
}

Write-Log "Verification result: Backend=$(if ($backendOk) {'ONLINE'} else {'STARTING'}), Frontend=$(if ($frontendOk) {'ONLINE'} else {'STARTING'})."
Write-Log "Access URL: http://localhost:$frontendPort"

if ($OpenBrowser) {
    Start-Process "http://localhost:$frontendPort"
}
