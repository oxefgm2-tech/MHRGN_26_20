# بسته قابل‌انتقال P1.4 — ناوبری موبایل (Mobile Navigation & Sidebar Drawer)

## ۱. هدف و ارزش ماژول
بهبود تجربه کاربری و ریسپانسیو کامل روی گوشی‌های موبایل و تبلت با نوار ناوبری پایین صفحه (`MobileBottomNav`) و کشوی سایدبار موبایل (`Sidebar`) کاملاً تفکیک‌شده و بدون وابستگی به وب‌سوکت یا شبکه.

## ۲. ساختار فایل‌ها
- `source/MobileBottomNav.tsx`: نوار دسترسی سریع پایین نمایشگر در موبایل
- `source/Sidebar.tsx`: منوی ناوبری اصلی همراه با کشوی واکنش‌گرا و دکمه بستن در موبایل
- `dependencies.json`: وابستگی‌های استاندارد React و Lucide Icons
- `tests/acceptance_test.ts`: آزمون پذیرش بررسی یکپارچگی فایل‌ها و عدم وابستگی به وب‌سوکت

## ۳. پیش‌نیازها
- React 18 یا 19
- Tailwind CSS
- lucide-react

## ۴. نحوه اعمال به Version5New
۱. فایل `source/MobileBottomNav.tsx` را به `src/components/MobileBottomNav.tsx` منتقل کنید.
۲. سایدبار بهبودیافته را به `src/components/Sidebar.tsx` منتقل نمایید.
۳. در `App.tsx` یا چیدمان اصلی، `MobileBottomNav` را در پایین صفحه رندر کنید.

## ۵. آزمون پذیرش (Acceptance Test)
```bash
npx tsx patches/P1.4-mobile-navigation/tests/acceptance_test.ts
```
نتیجه: تأیید کامل وجود هر دو کامپوننت و ایزوله‌بودن کامل از وابستگی‌های پس‌زمینه.
