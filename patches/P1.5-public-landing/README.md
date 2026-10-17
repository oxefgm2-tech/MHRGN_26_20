# بسته قابل‌انتقال P1.5 — صفحه فرود عمومی و مسیریابی (Clinic Landing & Location)

## ۱. هدف و ارزش ماژول
صفحه ورودی عمومی مشتریان و مراجعین کلینیک دامپزشکی مهرگان با معرفی خدمات تخصصی، پزشکان، ساعات کاری، گالری و دکمه‌های مسیریابی مستقیم روی نشان، بلد و گوگل مپ.

## ۲. ساختار فایل‌ها
- `source/ClinicLandingPage.tsx`: کامپوننت صفحه فرود جذاب و واکنش‌گرا
- `source/clinicLocation.ts`: ثابت‌های جغرافیایی، آدرس، تلفن و لینک‌های مسیریابی
- `dependencies.json`: وابستگی‌های استاندارد React و Lucide Icons
- `tests/acceptance_test.ts`: آزمون پذیرش صحت داده‌های جغرافیایی و استراکچر کامپوننت

## ۳. نحوه اعمال به Version5New
۱. فایل `source/clinicLocation.ts` را به `src/constants/clinicLocation.ts` منتقل کنید.
۲. کامپوننت `source/ClinicLandingPage.tsx` را به `src/components/ClinicLandingPage.tsx` منتقل کنید.
۳. در روت‌های عمومی یا روت ریشه `/` در حالت غیرلاگین این کامپوننت را نمایش دهید.

## ۴. آزمون پذیرش (Acceptance Test)
```bash
npx tsx patches/P1.5-public-landing/tests/acceptance_test.ts
```
نتیجه: تأیید کامل ۵۸ کیلوبایت کامپوننت صفحه فرود و لینک‌های مسیریابی نشان/بلد/گوگل.
