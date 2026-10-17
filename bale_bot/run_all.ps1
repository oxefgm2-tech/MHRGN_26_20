# Mehregan Clinic - Bale Bot & Microservices Launcher
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   Mehregan Veterinary Clinic - Bale Bot Services" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green

$botJob = Start-Process -WindowStyle Normal -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$rootDir'; Write-Host '=== Bale Messenger Bot (Mehregan) ===' -ForegroundColor Cyan; python main.py"

Write-Host "`nBale Bot launched in a separate process window." -ForegroundColor Green
Write-Host "Logs and webhook requests are synchronized with the central clinic system." -ForegroundColor Gray
