# Mehregan Clinic - Dial-Up Modem Voice Secretary Service Launcher (Windows)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   Mehregan Veterinary Clinic - Telephony Modem IVR" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green

Write-Host "Scanning available COM Ports in Windows Device Manager..." -ForegroundColor Cyan
try {
    $ports = [System.IO.Ports.SerialPort]::GetPortNames()
    if ($ports.Count -gt 0) {
        Write-Host "Detected Serial Ports: $($ports -join ', ')" -ForegroundColor Green
    } else {
        Write-Host "No physical COM ports found. Using Virtual / Emulated Voice Modem." -ForegroundColor Gray
    }
} catch {
    Write-Host "Using default COM3" -ForegroundColor Gray
}

Write-Host "`nLaunching Modem Voice Secretary Daemon..." -ForegroundColor Cyan
python "$ScriptDir\modem_ivr_daemon.py"
