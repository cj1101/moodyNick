# Restart Backend Server Script
Write-Host "🔄 Stopping existing backend servers..." -ForegroundColor Yellow

# Stop all node processes related to this project
Get-Process -Name node -ErrorAction SilentlyContinue | 
    Where-Object { $_.Path -like "*moodyNick*" } | 
    ForEach-Object {
        Write-Host "  Stopping process $($_.Id)..." -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force
    }

Start-Sleep -Seconds 2

Write-Host "✅ Old servers stopped" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Starting backend server..." -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Start the server
node server.js
