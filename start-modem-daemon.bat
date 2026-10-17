@echo off
chcp 65001 > nul
echo ==============================================================
echo  کلینیک اختصاصی حیوانات خانگی مهرگان اصفهان
echo  سرویس منشی تلفنی گویا و ضبط مکالمات با مودم ۵۶ کیلوبیت
echo ==============================================================
echo.
echo در حال بررسی پیش‌نیاز پایتون...
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [خطا] پایتون روی این سیستم یافت نشد. لطفاً Python 3.9+ را نصب کنید.
    pause
    exit /b 1
)

echo نصب پیش‌نیازهای سریال (pyserial)...
pip install pyserial requests > nul 2>&1

echo.
echo تنظیمات پیش‌فرض:
echo پورت مودم: COM3 (قابل تغییر در آرگومان)
echo مسیر ذخیره صوت محلی: C:\MehreganTelephony\Recordings
echo ارتباط با سرور کلینیک: http://localhost:3000
echo.
echo در صورت نیاز به شبیه‌سازی بدون مودم فیزیکی، دستور زیر را اجرا کنید:
echo python scripts/modem_ivr_daemon.py --simulate
echo.

python scripts/modem_ivr_daemon.py %*
pause
