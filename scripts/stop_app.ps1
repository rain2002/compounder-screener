# Compounder Screener - Services Shutdown Script
$rootDir = "D:\compounder-screener"
$logFile = Join-Path $rootDir "logs\startup.log"

function Write-Log {
    param([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "[$timestamp] $message"
    Add-Content -Path $logFile -Value $entry -ErrorAction SilentlyContinue
    Write-Output $entry
}

Write-Log "--- Stop sequence initiated ---"

# Ports to free
$ports = @(8000, 5173)

foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $pids) {
            try {
                $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Log "Terminating process on port $port (PID: $procId, Name: $($proc.ProcessName))..."
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                }
            } catch {}
        }
    } else {
        Write-Log "No active process listening on port $port."
    }
}

Write-Log "All services stopped."
