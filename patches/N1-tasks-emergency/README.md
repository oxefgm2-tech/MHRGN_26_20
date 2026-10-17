# بسته قابل‌انتقال N1 — وظایف پرسنل و فراخوان اضطراری (Staff Tasks & Emergency Summon)

## ۱. هدف و ارزش ماژول
این بسته شامل رابط کاربری مدیریت ماموریت‌ها و ارجاع وظایف پرسنل کلینیک (`StaffTasksDelegationTab`) به همراه مدال فراخوان اضطراری بلادرنگ (`EmergencySummonModal`) می‌باشد که قابلیت صدور آژیر صوتی و ارسال فوری درخواست به همه ایستگاه‌های فعال کلینیک را دارد.

## ۲. پیش‌نیازها و ریسک‌ها
> ⚠️ **وابستگی الزامی:** این بسته وابسته به **P1.3 (WebSocket /ws)** است و باید بعد از آن منتقل شود.
بدون لایه ارتباطی سوکت P1.3، رویدادهای `task:created`، `task:updated` و آژیر فراخوان اضطراری (`realtimeChat.triggerEmergencySummon`) به صورت بلادرنگ به دیگر کاربران منعکس نخواهد شد.

## ۳. ساختار فایل‌ها
- `source/StaffTasksDelegationTab.tsx`: تب جامع تعریف، فیلتر، اولویت‌بندی و پایش وضعیت تیکت‌های پرسنل
- `source/EmergencySummonModal.tsx`: مدال هشدار اضطراری (Code Blue / فراخوان کادر درمان)
- `server_endpoints.diff`: وصله روت‌های سروری در `server.ts`
- `dependencies.json`: وابستگی‌های فرانت‌اند و قید `requires`
- `env.example`: متغیرهای محیطی بدون مقدار
- `tests/acceptance_test.ts`: آزمون پذیرش جامع

## ۴. اندپوینت‌های سرور (در server_endpoints.diff)
- `GET /api/staff`: دریافت فهرست کادر فعال کلینیک
- `GET /api/tasks`: دریافت تیکت‌های وظایف (با فیلتر کاربری و نقش)
- `POST /api/tasks`: ثبت ماموریت جدید و صدور نوتیفیکیشن
- `PATCH /api/tasks/:id`: به‌روزرسانی وضعیت یا یادداشت وظیفه
- `DELETE /api/tasks/:id`: حذف وظیفه (مخصوص مدیر)

## ۵. آزمون پذیرش (Acceptance Test)
```bash
npx tsx patches/N1-tasks-emergency/tests/acceptance_test.ts
```
