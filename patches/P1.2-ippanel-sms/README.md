# بسته قابل‌انتقال P1.2 — سرویس پیامک IPPanel (smsService)

## ۱. هدف و ارزش ماژول
ارسال پیامک‌های خدماتی پترن‌محور (تأیید نوبت، یادآوری ۲۴ ساعته، صدور قبض، لینک مشاهده رادیوگرافی، اعلان ترخیص) از طریق درگاه IPPanel با امکان فال‌بک امن و ذخیره‌سازی پیکربندی محلی.

## ۲. ساختار فایل‌ها
- `source/smsService.ts`: سرویس متمرکز ارتباط با وب‌سرویس IPPanel
- `server_endpoints.diff`: تغییرات مورد نیاز برای افزودن اندپوینت‌های `/api/sms/*` به `server.ts`
- `env.example`: متغیرهای محیطی درگاه پیامک
- `dependencies.json`: وابستگی‌های npm (بدون نیاز به پکیج اضافی؛ از fetch استاندارد استفاده می‌کند)
- `tests/acceptance_test.ts`: آزمون پذیرش بررسی وضعیت و موجودی پیامک

## ۳. متغیرهای محیطی
```env
MPAYAM_DEADMAN_KEY_VALUE=کلید_ای‌پی‌آی_آی‌پی‌پنل
MPAYAM_SENDER_NUMBER=+983000505
MPAYAM_MOBILE=+989133115509
```

## ۴. نحوه اعمال به Version5New
۱. فایل `source/smsService.ts` را به `src/services/smsService.ts` در پروژه اصلی منتقل کنید.
۲. قطعه کد مشخص‌شده در `server_endpoints.diff` را به انتهای روت‌های `server.ts` اضافه کنید.
۳. متغیرهای `.env` را مقداردهی نمایید.

## ۵. آزمون پذیرش (Acceptance Test)
```bash
npx tsx patches/P1.2-ippanel-sms/tests/acceptance_test.ts
```
نتیجه: دریافت ۲۰۰ موفق از `/api/sms/status` و `/api/sms/credit`.
