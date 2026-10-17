# بسته قابل‌انتقال P1.1 — ربات بله کلینیک مهرگان (Bale Messenger Bot)

## ۱. هدف و ارزش ماژول
این بسته شامل ربات تعاملی پیام‌رسان بله برای کلینیک دامپزشکی مهرگان است که به عنوان سرویس مستقل لینوکسی (`systemd`) بدون وابستگی به هسته وب اپلیکیشن اجرا می‌شود.

## ۲. ساختار فایل‌ها
- `source/main.py`: نقطه ورود و هندلر اصلی پیام‌ها با فریمورک Balethon
- `source/bot/`: هندلرهای پیام و ماژول پاسخ‌دهی هوشمند
- `source/config/`: فایل‌های پیکربندی ساختاریافته (اطلاعات کلینیک، ساعات کاری، منو و خدمات)
- `requirements.txt`: وابستگی‌های پایتونی
- `env.example`: نمونه متغیرهای محیطی
- `systemd/mehregan-bale-bot.service`: فایل سرویس لینوکس جهت استقرار در سرور VPS
- `tests/acceptance_test.py`: تست پذیرش بررسی صحت ساختار و سینتکس

## ۳. پیش‌نیازها
- Python >= 3.10
- ساخت کاربر سرویس: `sudo useradd --system --no-create-home --shell /usr/sbin/nologin svc-clinic`
- نصب پکیج‌ها: `pip install -r requirements.txt`
- متغیر محیطی الزامی: `BALE_BOT_TOKEN`

## ۴. مراحل استقرار مستقل در Version5New
```bash
# ۱. ایجاد دایرکتوری در سرور
sudo mkdir -p /opt/mehregan-bale-bot
sudo cp -r source/* /opt/mehregan-bale-bot/

# ۲. ایجاد محیط مجازی پایتون
cd /opt/mehregan-bale-bot
python3 -m venv venv
./venv/bin/pip install -r requirements.txt

# ۳. تنظیم فایل متغیرهای محیطی
sudo cp env.example /etc/mehregan/bale_bot.env
sudo nano /etc/mehregan/bale_bot.env  # درج توکن واقعی

# ۴. ثبت و اجرای سرویس در systemd
sudo cp systemd/mehregan-bale-bot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now mehregan-bale-bot
sudo systemctl status mehregan-bale-bot
```

## ۵. آزمون پذیرش (Acceptance Test)
```bash
python3 tests/acceptance_test.py
```
نتیجه اجرا: بررسی کامل ۴ فایل پیکربندی JSON و کامپایل بدون خطای سینتکس `main.py`.
