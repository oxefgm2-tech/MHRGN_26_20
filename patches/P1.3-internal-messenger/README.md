# بسته قابل‌انتقال P1.3 — پیام‌رسان داخلی و احضار اضطراری (Internal Messenger & WS)

## ۱. هدف و ارزش ماژول
سیستم گفتگوی زنده، ارسال وویس، احضار اضطراری (فورس حضور پرسنل توسط مدیریت)، اعلام وظایف و وضعیت آنلاین کاربران روی لایه دوطرفه WebSocket مسیر `/ws`.

## ۲. ساختار فایل‌ها
- `source/InternalMessengerTab.tsx`: کامپوننت رابط کاربری گفتگو و فراخوان
- `source/realtimeChatService.ts`: سرویس کلاینت مدیریت سوکت، بازاتصال خودکار و پخش صدای اعلان
- `dependencies.json`: وابستگی‌های پکیج (`ws` و `lucide-react`)
- `server_endpoints.diff`: تغییرات سرور برای راه‌اندازی سرور WebSocket و روت‌های `/api/chat/*`
- `tests/acceptance_test.ts`: تست پذیرش بررسی باز شدن سوکت و تبادل پینگ-پنگ
- `env.example`: نمونه تنظیمات متغیر کلاینت

## ۳. پیش‌نیازها
- نصب پکیج `ws`: `npm install ws && npm install -D @types/ws`
- ادغام سرور HTTP با WebSocketServer در `server.ts`

## ۴. نحوه اعمال به Version5New
۱. نصب پکیج `ws`.
۲. انتقال کامپوننت `InternalMessengerTab.tsx` به `src/components/InternalMessengerTab.tsx`.
۳. انتقال سرویس `realtimeChatService.ts` به `src/services/realtimeChatService.ts`.
۴. اعمال پچ `server_endpoints.diff` روی `server.ts`.

## ۵. آزمون پذیرش (Acceptance Test)
```bash
npx tsx patches/P1.3-internal-messenger/tests/acceptance_test.ts
```
نتیجه: تأیید برقراری ارتباط با پورت ۳۰۰۰ مسیر `/ws` و دریافت فریم `{"type":"pong"}` در زمان کمتر از ۳ ثانیه.
