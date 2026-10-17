# بسته قابل‌انتقال N3 — منشی تلفنی هوشمند و IVR (لایه نرم‌افزاری SIP)

## ۱. بیانیه معماری و سه اصل کلیدی
1. **لایهٔ UI/مدیریت (تب + روت‌ها) مستقل از سخت‌افزار و منتقل‌شدنی است:** تب `TelephonySecretaryTab` و روت‌های `/api/telephony/*` صف تماس، لاگ صوتی، تحلیل هوش مصنوعی رونوشت‌ها و تبدیل به نوبت/سفارش را بدون وابستگی به سخت‌افزار مدیریت می‌کنند.
2. **موتور اجرای صوتی روی مودم ۵۶K ممکن نیست؛ گیتوی FXO + SIP لازم است:** چیپ‌ست سخت‌افزاری موجود در کیس کلینیک (`14f1:2f30` Conexant SoftV92) روی توزیع‌های مدرن لینوکس درایور کرنل ندارد و فاقد قابلیت پخش/ضبط صدای آنالوگ است. بنابراین استفاده از ماژول گیتوی FXO سخت‌افزاری یا PBX مبتنی بر SIP (مانند Asterisk / FreeSWITCH) الزامی است.
3. **روی VPS بی‌معناست؛ فقط روی کیس فیزیکی کلینیک (کنار خط تلفن) فعال شود:** دریافت فیزیکی بوق و خط تلفن شهری کلینیک در دیتاسنتر یا کلود ممکن نیست و باید در سیستم محلی کلینیک استقرار یابد.

## ۲. وضعیت فایل‌های بازنشسته (مودم ۵۶K در پوشه legacy/)
فایل‌های ذیل به دلیل عدم پشتیبانی سخت‌افزاری مودم ۵۶K در سیستم‌عامل‌های امروزی بازنشسته شده و در پوشه `legacy/` نگهداری می‌شوند:
- `legacy/modem_ivr_daemon.py`: دیمن پایتونی پورت سریال AT Commands (بازنشسته)
- `legacy/Start-ModemVoiceService.ps1`: اسکریپت پاورشل سرویس ویندوز (بازنشسته)
- `legacy/start-modem-daemon.bat`: بچ‌فایل اجرای لوکال (بازنشسته)

> 💡 **تذکر نام‌گذاری:** نام فایل `source/telephonyModemService.ts` تاریخی است و در فاز پیاده‌سازی سرویس SIP باید به `telephonySipService.ts` تغییر نام داده و بازنویسی شود.

## ۳. ساختار فایل‌های بسته
- `source/TelephonySecretaryTab.tsx`: رابط کاربری مدیریت صف تماس، ضبط مکالمات و تحلیل بالینی
- `source/telephonyModemService.ts`: سرویس کلاینت تعامل با سرور تلفنی
- `legacy/`: کدهای بازنشسته مودم آنالوگ ۵۶K
- `server_endpoints.diff`: وصله روت‌های سرور `/api/telephony/*`
- `env.example`: نمونه متغیرهای محیطی گیتوی SIP و ذخیره‌سازی صدا
- `dependencies.json`: وابستگی‌های فرانت‌اند و پیشنهاد سرور SIP
- `tests/acceptance_test.ts`: آزمون پذیرش جامع

## ۴. روت‌های سروری موجود
- `GET /api/telephony/modems`: دریافت وضعیت اینترفیس‌ها
- `GET / POST /api/telephony/config`: پیکربندی ساعات کارکرد و سناریوی منشی
- `GET / POST /api/telephony/calls`: دریافت و ثبت لاگ تماس
- `POST /api/telephony/upload-recording`: آپلود فایل صوتی مکالمه
- `GET /api/telephony/recordings/:filename`: پخش صدای ضبط‌شده
- `PATCH /api/telephony/calls/:id`: به‌روزرسانی بررسی تماس
- `POST /api/telephony/calls/:id/convert-to-appointment`: تبدیل تماس به نوبت ویزیت
- `POST /api/telephony/calls/:id/convert-to-petshop-order`: تبدیل تماس به سفارش پت‌شاپ
- `POST /api/telephony/calls/batch-review`: بررسی گروهی تماس‌ها
- `POST /api/telephony/ai-structure-transcript`: استخراج هوشمند اطلاعات پت و مالک با AI
- `POST /api/telephony/simulate-call`: شبیه‌سازی تماس ورودی

## ۵. آزمون پذیرش (Acceptance Test)
```bash
npx tsx patches/N3-telephony-ivr/tests/acceptance_test.ts
```
