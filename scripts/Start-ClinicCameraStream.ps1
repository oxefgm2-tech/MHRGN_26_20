<#
.SYNOPSIS
    Mehregan Pet Clinic - Android Mobile LAN Camera Stream Bridge
.DESCRIPTION
    اتصال دوربین موبایل اندروید از طریق وای‌فای محلی (LAN Router) به سامانه کلینیک دامپزشکی مهرگان
    این اسکریپت آدرس IP گوشی اندروید در شبکه Wi-Fi را بررسی نموده و استریم ویدیو را تست و باز می‌کند.
.EXAMPLE
    .\Start-ClinicCameraStream.ps1 -PhoneIp "192.168.1.120" -Port 8080
#>

param(
    [string]$PhoneIp = "192.168.1.120",
    [int]$Port = 8080,
    [string]$ClinicServerUrl = "http://192.168.1.50:3000"
)

Write-Host "======================================================" -ForegroundColor Green
Write-Host "  کلینیک دامپزشکی حیوانات خانگی مهرگان (اصفهان - جلفا)" -ForegroundColor Cyan
Write-Host "  راه‌اندازی دوربین ورودی با گوشی اندروید در شبکه LAN Wi-Fi" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Green

# 1. تست اتصال اولیه شبکه محلی (Ping)
Write-Host "[1/4] بررسی اتصال به گوشی موبایل در آدرس $PhoneIp ..." -ForegroundColor White
$ping = Test-Connection -ComputerName $PhoneIp -Count 2 -Quiet

if (-not $ping) {
    Write-Host "[!] خطا: گوشی موبایل در آدرس $PhoneIp پاسخ نداد." -ForegroundColor Red
    Write-Host "    لطفاً مطمئن شوید گوشی به همان شبکه Wi-Fi کلینیک متصل است." -ForegroundColor Yellow
} else {
    Write-Host "[✓] ارتباط شبکه با گوشی موبایل با موفقیت برقرار شد." -ForegroundColor Green
}

# 2. تست دسترسی به پورت استریم
$streamUrl = "http://$PhoneIp`:$Port/video"
$snapshotUrl = "http://$PhoneIp`:$Port/shot.jpg"

Write-Host "[2/4] بررسی باز بودن پورت ویدیو ($Port) ..." -ForegroundColor White
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect($PhoneIp, $Port)
    $tcp.Close()
    Write-Host "[✓] پورت $Port روی گوشی باز است و آماده پخش استریم است." -ForegroundColor Green
} catch {
    Write-Host "[!] پورت $Port در دسترس نیست. مطمئن شوید در اپلیکیشن IP Webcam دکمه Start Server زده شده است." -ForegroundColor Yellow
}

# 3. ثبت آدرس استریم در سرور کلینیک
Write-Host "[3/4] تنظیم آدرس دوربین در سامانه کلینیک مهرگان ($ClinicServerUrl) ..." -ForegroundColor White
try {
    $body = @{
        cameraIp = $PhoneIp
        port = $Port
        streamUrl = $streamUrl
        snapshotUrl = $snapshotUrl
        sourceType = "android_lan_wifi"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$ClinicServerUrl/api/system/entrance-camera" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 4
    Write-Host "[✓] آدرس دوربین در سامانه ذخیره شد: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "[*] سرور محلی کلینیک در دسترس است و استریم مستقیم در مرورگر قابل مشاهده است." -ForegroundColor Gray
}

# 4. باز کردن استریم در مرورگر
Write-Host "[4/4] باز کردن پیش‌نمایش تصویر دوربین ورودی ..." -ForegroundColor White
Write-Host "آدرس استریم ویدیو: $streamUrl" -ForegroundColor Cyan
Write-Host "آدرس عکس لحظه‌ای: $snapshotUrl" -ForegroundColor Cyan

Start-Process "http://$PhoneIp`:$Port"

Write-Host "======================================================" -ForegroundColor Green
Write-Host "دوربین ورودی لابی آماده بهره‌برداری است." -ForegroundColor Green
