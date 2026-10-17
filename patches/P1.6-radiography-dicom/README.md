# بسته قابل‌انتقال P1.6 — پایپلاین امن رادیوگرافی و ویوور DICOM (Radiography / DICOM)

## ۱. هدف و ارزش ماژول
انتقال کاملاً امن و یک‌طرفه فایل‌های رادیوگرافی از سیستم ویندوز ۷ دستگاه (که به اینترنت متصل نمی‌شود) به سرور فیزیکی کلینیک (`\\ncase3` اوبونتو ۲۴)، همگام‌سازی با VPS، فرم تکمیل مشخصات بالینی پت، و ارسال لینک مشاهده آنلاین اختصاصی برای مالکان پت روی پیام‌رسان بله و پیامک.

## ۲. ساختار فایل‌ها
- `scripts/Configure-Win7RadiographySecurity.ps1`: اسکریپت امن‌سازی ویندوز ۷، قطع اینترنت و باز کردن پایپ تک‌مسیره به ncase3
- `scripts/setup-ncase3-radiography.sh`: اسکریپت راه‌اندازی دایرکتوری‌ها و اشتراک Samba روی اوبونتو ۲۴ سرور ncase3
- `scripts/RadiographyAgent.hta`: پنل لوکال HTA ویندوز ۷ برای مانیتورینگ پوشه مبدأ و کپی هر ۱ دقیقه
- `scripts/Run-RadiographyAgent.bat`: اجرای تک‌کلیک ایجنت ویندوز ۷
- `scripts/Start-RadiographySync.ps1`: سرویس پس‌زمینه کپی در ویندوز ۷
- `scripts/radiography-viewer.html`: ویوور استاتیک سبک DICOM/گراف با فرم داده‌های پزشکی
- `ui/RadiographyModal.tsx`: مودال وب اپلیکیشن جهت الصاق گراف به پرونده بیمار و ارسال لینک بله/پیامک
- `server_endpoints.diff`: پچ روت‌های سرور `/api/radiography/*`
- `env.example`: متغیرهای مسیر ذخیره‌سازی
- `tests/acceptance_test.ts`: آزمون پذیرش بررسی اسکریپت‌ها و پاسخ‌دهی اندپوینت‌های سرور

## ۳. مراحل نصب سخت‌افزاری
۱. اجرای `Configure-Win7RadiographySecurity.ps1` با دسترسی ادمین روی ویندوز ۷ دستگاه رادیوگرافی.
۲. اجرای `setup-ncase3-radiography.sh` روی سرور فیزیکی اوبونتو ncase3.
۳. قراردادن شرت‌کات `Run-RadiographyAgent.bat` در استارتاپ ویندوز ۷.

## ۴. آزمون پذیرش (Acceptance Test)
```bash
npx tsx patches/P1.6-radiography-dicom/tests/acceptance_test.ts
```
نتیجه: تأیید سلامت ۶ اسکریپت سیستمی و پاسخ‌دهی روت سرور.
