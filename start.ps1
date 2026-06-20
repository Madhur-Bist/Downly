Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Downly - Universal Video Downloader   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
try { python --version 2>&1 | Out-Null; Write-Host "✓ Python found" -ForegroundColor Green }
catch { Write-Host "✗ Python not found. Install Python 3.10+" -ForegroundColor Red; exit 1 }

# Check Node
try { node --version 2>&1 | Out-Null; Write-Host "✓ Node.js found" -ForegroundColor Green }
catch { Write-Host "✗ Node.js not found. Install Node 18+" -ForegroundColor Red; exit 1 }

# Check FFmpeg
try { ffmpeg -version 2>&1 | Out-Null; Write-Host "✓ FFmpeg found" -ForegroundColor Green }
catch { Write-Host "⚠ FFmpeg not found. Install from https://ffmpeg.org" -ForegroundColor Yellow }

Write-Host ""
Write-Host "Starting backend..." -ForegroundColor Yellow

$backendJob = Start-Job -ScriptBlock {
    Set-Location "$using:PWD\backend"
    python main.py
}

Start-Sleep -Seconds 3

Write-Host "Starting frontend..." -ForegroundColor Yellow

$frontendJob = Start-Job -ScriptBlock {
    Set-Location "$using:PWD\frontend"
    npm run dev
}

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow

try {
    while ($true) {
        Start-Sleep -Seconds 1
        $backendState = $backendJob.State
        $frontendState = $frontendJob.State
        if ($backendState -eq "Failed") {
            Receive-Job $backendJob
            Write-Host "Backend crashed!" -ForegroundColor Red
            break
        }
        if ($frontendState -eq "Failed") {
            Receive-Job $frontendJob
            Write-Host "Frontend crashed!" -ForegroundColor Red
            break
        }
    }
}
finally {
    Write-Host "Stopping..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $frontendJob -ErrorAction SilentlyContinue
}
