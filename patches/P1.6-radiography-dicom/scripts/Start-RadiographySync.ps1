<#
.SYNOPSIS
    Mehregan Clinic - Windows 7 Background Radiography Auto-Copy Daemon
    Polls source directory every 60 seconds and copies newly produced graphs to \\ncase3\radiography\incoming.
#>

param (
    [string]$SourceDir = "C:\Radiography\Export",
    [string]$DestDir = "\\ncase3\radiography\incoming",
    [int]$IntervalSeconds = 60
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   Mehregan Clinic - Background Radiography Synchronizer" -ForegroundColor Green
Write-Host "   Source: $SourceDir | Target: $DestDir | Interval: ${IntervalSeconds}s" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan

if (-not (Test-Path $SourceDir)) {
    New-Item -Path $SourceDir -ItemType Directory -Force | Out-Null
}

$historyFile = "C:\Radiography\Agent\ps_copied_history.txt"
$historyFolder = Split-Path $historyFile
if (-not (Test-Path $historyFolder)) {
    New-Item -Path $historyFolder -ItemType Directory -Force | Out-Null
}

$copiedSet = New-Object System.Collections.Generic.HashSet[string]
if (Test-Path $historyFile) {
    Get-Content $historyFile | ForEach-Object {
        if (-not [string]::IsNullOrWhiteSpace($_)) {
            $copiedSet.Add($_.Trim()) | Out-Null
        }
    }
}

Write-Host "✓ History loaded: $($copiedSet.Count) previously synchronized files." -ForegroundColor Green
Write-Host "Daemon running in loop. Press Ctrl+C to terminate.`n" -ForegroundColor White

while ($true) {
    try {
        $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        
        # Test target connectivity
        if (-not (Test-Path $DestDir)) {
            try {
                New-Item -Path $DestDir -ItemType Directory -Force -ErrorAction Stop | Out-Null
            } catch {
                Write-Host "[$now] ⚠ Cannot connect to target $DestDir. Server ncase3 might be offline." -ForegroundColor Red
                Start-Sleep -Seconds $IntervalSeconds
                continue
            }
        }

        $files = Get-ChildItem -Path $SourceDir -File -Recurse -ErrorAction SilentlyContinue
        $newCount = 0

        foreach ($file in $files) {
            $key = "$($file.Name)_$($file.Length)_$($file.LastWriteTimeUtc.Ticks)"
            if (-not $copiedSet.Contains($key)) {
                $targetPath = Join-Path $DestDir $file.Name
                Copy-Item -Path $file.FullName -Destination $targetPath -Force -ErrorAction Stop
                
                $copiedSet.Add($key) | Out-Null
                Add-Content -Path $historyFile -Value $key
                $newCount++
                
                $sizeKb = [math]::Round($file.Length / 1KB, 1)
                Write-Host "[$now] ✓ COPIED: $($file.Name) (${sizeKb} KB) -> $DestDir" -ForegroundColor Green
            }
        }

        if ($newCount -eq 0) {
            Write-Host "[$now] Checked $SourceDir - No new files. Sleeping ${IntervalSeconds}s..." -ForegroundColor DarkGray
        } else {
            Write-Host "[$now] Successfully transferred $newCount new graph(s) to ncase3." -ForegroundColor Cyan
        }
    } catch {
        Write-Host "Error in sync cycle: $_" -ForegroundColor Red
    }

    Start-Sleep -Seconds $IntervalSeconds
}
