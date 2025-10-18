# Kill all Node.js processes (including dev servers)
# This is useful when multiple dev servers are running on different ports

Write-Host "Stopping all Node.js dev servers..." -ForegroundColor Yellow

# Get all node processes
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Cyan

    foreach ($process in $nodeProcesses) {
        try {
            Write-Host "  Killing process $($process.Id) on port(s): $(Get-NetTCPConnection -OwningProcess $process.Id -ErrorAction SilentlyContinue | Select-Object -ExpandProperty LocalPort -Unique)" -ForegroundColor Gray
            Stop-Process -Id $process.Id -Force
            Write-Host "  ✓ Process $($process.Id) stopped" -ForegroundColor Green
        }
        catch {
            Write-Host "  ✗ Failed to stop process $($process.Id): $_" -ForegroundColor Red
        }
    }

    Write-Host "`nAll Node.js processes stopped!" -ForegroundColor Green
    Write-Host "You can now run 'npm run dev' to start a fresh server on port 3004" -ForegroundColor Cyan
}
else {
    Write-Host "No Node.js processes found running" -ForegroundColor Green
}
