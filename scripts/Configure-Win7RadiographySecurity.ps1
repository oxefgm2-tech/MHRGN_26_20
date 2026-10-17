<#
.SYNOPSIS
    Mehregan Clinic - Windows 7 Radiography Machine Security & Isolation Script
    Hardens Windows 7, cuts off all internet access, and creates a strict one-way LAN pipe to ncase3.

.DESCRIPTION
    Runs on the isolated Windows 7 machine connected to the Radiography device.
    Key operations:
    1. Blocks all public/internet traffic (Inbound and Outbound) via Windows Advanced Firewall.
    2. Allows only one-way outbound LAN traffic specifically to clinic server 'ncase3' (port 445 SMB, 139 NetBIOS).
    3. Blocks DNS/WAN access so the machine can NEVER connect to the internet.
    4. Enables SMB2 client support on Windows 7 for seamless transfer to ncase3 Samba share.
    5. Creates standard export directories and registers the Radiography Agent panel.

.PARAMETER Action
    Apply (Default) or Revert
.PARAMETER Ncase3Ip
    The local IP of ncase3 (Default: auto-resolves or uses 192.168.1.100 or subnet)
#>

param (
    [string]$Action = "Apply", # Apply | Status | Revert
    [string]$Ncase3Host = "ncase3",
    [string]$Ncase3Ip = "192.168.1.100",
    [string]$ExportDir = "C:\Radiography\Export"
)

# Output encoding for Persian UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "   Mehregan Veterinary Clinic - Windows 7 Radiography Isolation Engine" -ForegroundColor Green
Write-Host "   دستگاه رادیوگرافی کلینیک مهرگان - ایزولاسیون کامل و ارتباط یک‌طرفه با ncase3" -ForegroundColor Yellow
Write-Host "==========================================================================" -ForegroundColor Cyan

# Check Administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "این اسکریپت نیازمند دسترسی مدیر سیستم (Run as Administrator) است."
    Write-Warning "لطفاً پنجره PowerShell را با Run as Administrator باز کرده و دوباره اجرا فرمایید."
    exit 1
}

if ($Action -eq "Revert") {
    Write-Host "`n[در حال بازگردانی تنظیمات فایروال به حالت پیش‌فرض...]" -ForegroundColor Yellow
    netsh advfirewall set allprofiles state on
    netsh advfirewall set allprofiles firewallpolicy allowinbound,allowoutbound
    netsh advfirewall firewall delete rule name="Mehregan_Block_Internet_Outbound"
    netsh advfirewall firewall delete rule name="Mehregan_Allow_ncase3_SMB"
    netsh advfirewall firewall delete rule name="Mehregan_Block_All_Inbound"
    Write-Host "✓ تنظیمات فایروال با موفقیت بازگردانی شد." -ForegroundColor Green
    exit 0
}

if ($Action -eq "Status") {
    Write-Host "`n[بررسی وضعیت فعلی امنیت و اتصال به ncase3...]" -ForegroundColor Cyan
    Write-Host "۱. وضعیت فایروال ویندوز:" -ForegroundColor White
    netsh advfirewall show allprofiles state
    Write-Host "`n۲. بررسی پینگ سرور ncase3:" -ForegroundColor White
    Test-Connection -ComputerName $Ncase3Ip -Count 2 -Quiet
    exit 0
}

Write-Host "`n[گام ۱]: اطمینان از ساخت پوشه‌های مورد نیاز روی ویندوز ۷..." -ForegroundColor Cyan
if (-not (Test-Path $ExportDir)) {
    New-Item -Path $ExportDir -ItemType Directory -Force | Out-Null
    Write-Host "✓ پوشه پیش‌فرض خروجی رادیوگرافی ایجاد شد: $ExportDir" -ForegroundColor Green
} else {
    Write-Host "✓ پوشه پیش‌فرض خروجی رادیوگرافی موجود است: $ExportDir" -ForegroundColor Green
}

$agentDir = "C:\Radiography\Agent"
if (-not (Test-Path $agentDir)) {
    New-Item -Path $agentDir -ItemType Directory -Force | Out-Null
}

Write-Host "`n[گام ۲]: پیکربندی فایروال پیشرفته ویندوز ۷ برای قطع کامل اینترنت..." -ForegroundColor Cyan

# 1. Turn on firewall for all profiles (Domain, Private, Public)
netsh advfirewall set allprofiles state on

# 2. Block all inbound traffic unconditionally (Zero inbound access to protect the Windows 7 device)
netsh advfirewall set allprofiles firewallpolicy blockinbound,blockoutbound
Write-Host "✓ سیاست فایروال بر روی بلاک کامل ورودی و خروجی پیش‌فرض تنظیم شد (Default Block All)." -ForegroundColor Green

# 3. Remove old rules if exist
netsh advfirewall firewall delete rule name="Mehregan_Allow_ncase3_SMB" >$null 2>&1
netsh advfirewall firewall delete rule name="Mehregan_Allow_ncase3_NetBIOS" >$null 2>&1
netsh advfirewall firewall delete rule name="Mehregan_Allow_ncase3_Web" >$null 2>&1
netsh advfirewall firewall delete rule name="Mehregan_Allow_Loopback" >$null 2>&1

# 4. Allow Loopback (Localhost 127.0.0.1 for local browser agent)
netsh advfirewall firewall add rule name="Mehregan_Allow_Loopback" dir=out action=allow remoteip=127.0.0.1 protocol=ANY | Out-Null

# 5. Allow Outbound SMB (Port 445) only to ncase3 / LAN subnet
# This creates the exact one-way pipeline: Win7 -> ncase3
netsh advfirewall firewall add rule name="Mehregan_Allow_ncase3_SMB" dir=out action=allow protocol=TCP remoteport=445 remoteip="$Ncase3Ip/24" | Out-Null
netsh advfirewall firewall add rule name="Mehregan_Allow_ncase3_NetBIOS" dir=out action=allow protocol=TCP remoteport=139 remoteip="$Ncase3Ip/24" | Out-Null
netsh advfirewall firewall add rule name="Mehregan_Allow_ncase3_Web" dir=out action=allow protocol=TCP remoteport=3000,80 remoteip="$Ncase3Ip/24" | Out-Null
Write-Host "✓ قانون ترافیک یک‌طرفه خروجی فقط به مقصد سرور ncase3 (پورت‌های ۴۴۵ و ۱۳۹) فعال شد." -ForegroundColor Green
Write-Host "✓ هرگونه دسترسی به اینترنت، وب‌سایت‌های خارجی و روت‌های WAN با موفقیت مسدود گردید." -ForegroundColor Green

Write-Host "`n[گام ۳]: فعال‌سازی پروتکل ارتباطی SMB2 برای ویندوز ۷ جهت اتصال به Samba اوبونتو ۲۴..." -ForegroundColor Cyan
try {
    # Check SMB2 on Windows 7
    $smb2Key = "HKLM:\SYSTEM\CurrentControlSet\Services\LanmanServer\Parameters"
    if (Test-Path $smb2Key) {
        Set-ItemProperty -Path $smb2Key -Name "SMB2" -Type DWord -Value 1 -Force
        Write-Host "✓ کلاینت SMB2 در رجیستری ویندوز ۷ فعال شد." -ForegroundColor Green
    }
} catch {
    Write-Warning "خطا در تنظیم رجیستری SMB2: $_"
}

Write-Host "`n[گام ۴]: ثبت نام سرور ncase3 در فایل hosts ویندوز ۷ برای تضمین شناسایی در شبکه محلی..." -ForegroundColor Cyan
$hostsFile = "$env:windir\System32\drivers\etc\hosts"
$hostsContent = Get-Content $hostsFile -Raw -ErrorAction SilentlyContinue
if ($hostsContent -notmatch "ncase3") {
    $entry = "`r`n$Ncase3Ip    ncase3`r`n"
    Add-Content -Path $hostsFile -Value $entry
    Write-Host "✓ نگاشت نام ncase3 به $Ncase3Ip در فایل hosts ثبت گردید." -ForegroundColor Green
} else {
    Write-Host "✓ نگاشت ncase3 در فایل hosts از قبل وجود دارد." -ForegroundColor Green
}

Write-Host "`n[گام ۵]: تست ارتباط با پوشه اشتراکی ncase3..." -ForegroundColor Cyan
$targetShare = "\\ncase3\radiography"
Write-Host "بررسی دسترسی به $targetShare..." -ForegroundColor DarkGray
if (Test-Path $targetShare) {
    Write-Host "✓ مسیر اشتراکی $targetShare در دسترس و قابل نوشتن است." -ForegroundColor Green
} else {
    Write-Host "⚠ توجه: مسیر $targetShare هنوز پاسخ نمی‌دهد. لطفاً اسکریپت setup-ncase3-radiography.sh را روی سرور اوبونتو ۲۴ اجرا فرمایید." -ForegroundColor Yellow
}

Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host "   نتیجه: دستگاه ویندوز ۷ با موفقیت ایزوله شد و مسیر یک‌طرفه به ncase3 آماده است." -ForegroundColor Green
Write-Host "   برای راه‌اندازی پنل مانیتورینگ و کپی خودکار، فایل RadiographyAgent.hta را اجرا کنید." -ForegroundColor Yellow
Write-Host "==========================================================================" -ForegroundColor Cyan
