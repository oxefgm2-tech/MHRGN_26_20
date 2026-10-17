# برنامه انتقال وصله‌ها به پروژه اصلی (Version5New)
# Transfer Patch Plan: Mehregan Clinic Architecture

این سند برنامهٔ استراتژیک و تفکیک‌شده برای انتقال قابلیت‌های توسعه‌یافته در این مخزن به پروژه اصلی (`Version5New`) را بدون بازنویسی یا آسیب به معماری پایدار تولید ارائه می‌دهد.

---

## جدول جامع انتقال وصله‌ها (Capability Transfer Matrix)

| ردیف | قابلیت | اولویت | فایل‌های مبدأ در وصله | پیش‌نیازها | سطح ریسک | آزمون پذیرش و شاهد |
|---|---|---|---|---|---|---|
| **P1.1** | **ربات بله** (`bale_bot/`) | اول | `patches/P1.1-bale-bot/source/`<br>• `main.py`<br>• `bot/`<br>• `config/*.json`<br>• `systemd/mehregan-bale-bot.service` | Python 3.10+<br>`pip install -r requirements.txt`<br>توکن `BALE_BOT_TOKEN` | بسیار پایین (سرویس کاملاً مستقل خارج از نود) | `python3 patches/P1.1-bale-bot/tests/acceptance_test.py`<br>✓ صحت سینتکس و ولیدیشن ۴ فایل JSON کانفیگ |
| **P1.2** | **پیامک IPPanel** (`smsService`) | دوم | `patches/P1.2-ippanel-sms/source/smsService.ts`<br>`patches/P1.2-ippanel-sms/server_endpoints.diff` | متغیر محیطی `MPAYAM_DEADMAN_KEY_VALUE`<br>شماره خط خدماتی | پایین (ایزوله، در صورت قطعی پنل به حالت آفلاین می‌رود) | `npx tsx patches/P1.2-ippanel-sms/tests/acceptance_test.ts`<br>✓ بازگشت وضعیت ۲۰۰ از `/api/sms/status` و موجودی ریالی |
| **P1.3** | **پیام‌رسان داخلی و احضار اضطراری** | سوم | `patches/P1.3-internal-messenger/source/`<br>• `InternalMessengerTab.tsx`<br>• `realtimeChatService.ts`<br>`server_endpoints.diff` | پکیج `ws` و `@types/ws`<br>مسیر روت `/ws` روی سرور HTTP | متوسط (نیازمند پشتیبانی WebSocket در Nginx معکوس) | `npx tsx patches/P1.3-internal-messenger/tests/acceptance_test.ts`<br>✓ اتصال سوکت به `ws://localhost:3000/ws` و پاسخ `pong` |
| **P1.4** | **ناوبری موبایل و کشوی سایدبار** | چهارم | `patches/P1.4-mobile-navigation/source/`<br>• `MobileBottomNav.tsx`<br>• `Sidebar.tsx` | React 18/19<br>Tailwind CSS<br>lucide-react (بدون وب‌سوکت) | بسیار پایین (صرفاً UI و بدون تغییر در استور داده) | `npx tsx patches/P1.4-mobile-navigation/tests/acceptance_test.ts`<br>✓ بررسی یکپارچگی کامپوننت و عدم وابستگی به سوکت |
| **P1.5** | **صفحه فرود عمومی و مسیریابی** | پنجم | `patches/P1.5-public-landing/source/`<br>• `ClinicLandingPage.tsx`<br>• `clinicLocation.ts` | React 18/19<br>Tailwind CSS<br>ثابت‌های جغرافیایی نشان/بلد | صفر (صفحه استاتیک بدون دسترسی به دیتابیس داخلی) | `npx tsx patches/P1.5-public-landing/tests/acceptance_test.ts`<br>✓ راستی‌آزمایی متادیتا و لینک‌های نقشه نشان/بلد/گوگل |
| **P1.6** | **پایپلاین رادیوگرافی و ویوور** | ششم | `patches/P1.6-radiography-dicom/`<br>• `scripts/*.ps1, *.sh, *.hta, *.bat`<br>• `scripts/radiography-viewer.html`<br>• `ui/RadiographyModal.tsx`<br>`server_endpoints.diff` | ویندوز ۷ ایزوله (بدون اینترنت)<br>پوشه اشتراکی Samba روی ncase3 (Ubuntu 24)<br>روت‌های `/api/radiography/*` | متوسط (نیاز به اجرای دستی اسکریپت‌ها روی سیستم فیزیکی) | `npx tsx patches/P1.6-radiography-dicom/tests/acceptance_test.ts`<br>✓ تأیید سلامت ۶ اسکریپت نصبی و اندپوینت سرور |
| **P1.7** | **اتصال فقط‌خواندنی دیتابیس قدیمی** | هفتم | `patches/P1.7-legacy-sql-server/source/`<br>• `legacyDatabaseService.ts`<br>• `LegacyDatabasesConnectorPanel.tsx`<br>• `Connect-LegacyDatabases.ps1`<br>`server_endpoints.diff` | شبکه محلی ncase3<br>SQL Server dam2000 و Parsian1405 | صفر (کاملاً فقط‌خواندنی و Dry-Run، بدون دستکاری) | `npx tsx patches/P1.7-legacy-sql-server/tests/acceptance_test.ts`<br>✓ اعتبارسنجی اسکیمای ۴ جدول dam2000 و ۴ جدول پارسیان |
| **N1** | **وظایف پرسنل + فراخوان اضطراری** | هشتم | `patches/N1-tasks-emergency/source/`<br>• `StaffTasksDelegationTab.tsx`<br>• `EmergencySummonModal.tsx`<br>`server_endpoints.diff` | وابستگی الزامی به **P1.3 (WebSocket /ws)**<br>احراز هویت پرسنل | متوسط (نیازمند استقرار موفق P1.3 برای هشدار بلادرنگ) | `npx tsx patches/N1-tasks-emergency/tests/acceptance_test.ts`<br>✓ اعتبارسنجی فایل‌ها، ۵ اندپوینت در diff و پاسخ ۲۰۰ سرور |
| **N2** | **پل همگام‌سازی ربات بله ↔ هسته** | نهم | `patches/N2-bale-sync/source/`<br>• `baleBotSyncService.ts`<br>`server_endpoints.diff` | وابسته به **P1.1 (ربات بله)**<br>توکن `BALE_BOT_TOKEN`<br>`clinicLocation` (از P1.5) | بسیار پایین (تبدیل‌گر داده‌ای کلاینت‌ساید/سرویس‌به‌سرویس) | `npx tsx patches/N2-bale-sync/tests/acceptance_test.ts`<br>✓ اعتبارسنجی خروجی توابع تبدیل اطلاعات و ساعات کاری |
| **N3** | **منشی تلفنی هوشمند / IVR (لایه SIP)** | دهم | `patches/N3-telephony-ivr/source/`<br>• `TelephonySecretaryTab.tsx`<br>• `telephonyModemService.ts`<br>`legacy/`<br>`server_endpoints.diff` | گیتوی سخت‌افزاری FXO + سرور SIP (Asterisk/FreeSWITCH)<br>خط شهری کلینیک (فقط کیس محلی، نه VPS) | بالا (نیازمند گیتوی فیزیکی FXO و بازنویسی سرویس به لایه SIP) | `npx tsx patches/N3-telephony-ivr/tests/acceptance_test.ts`<br>✓ سنجش تب UI، ۳ اسکریپت legacy، روت‌های diff و پاسخ اندپوینت مودم |
| **N4** | **ادغام دوگانه رادیوگرافی (پل فایل + DICOM)** | یازدهم | `patches/N4-radiography-dual-ingest/source/`<br>• `unifiedIngestQueue.ts`<br>• `orthancDicomAdapter.ts`<br>`docs/dicom_scp_configuration.md`<br>`server_endpoints.diff` | وابسته به **P1.6 (پل فایل Samba)**<br>سرور Orthanc PACS (Store SCP)<br>کنسول FUJIFILM CR-IR 392 | پایین (مسیر افزودنی مکمل پل فایل، بدون تغییر روت‌های P1.6) | `npx tsx patches/N4-radiography-dual-ingest/tests/acceptance_test.ts`<br>✓ سنجش نگاشت تگ‌های DICOM و یکتاسازی شناسه بیمار در صف |

---

## راهنمای گام‌به‌گام انتقال وصله‌ها

### قانون آهنین عدم رونویسی (Zero Overwrite Policy)
هیچ‌گاه کل این مخزن را بر روی `Version5New` کپی نکنید. هر بسته باید طبق ترتیب اولویت فوق، به صورت پوشه و وصله مجزا منتقل شود:

1. **انتقال مستقل P1.1 (ربات بله):**
   - کل پوشه `patches/P1.1-bale-bot/source/` را به سرور لینوکس مقصد در مسیر `/opt/mehregan-bale-bot` منتقل کنید.
   - سرویس `systemd` را از روی `patches/P1.1-bale-bot/systemd/mehregan-bale-bot.service` فعال کنید.

2. **انتقال P1.2 (سرویس پیامک):**
   - فایل `smsService.ts` را به `src/services/` منتقل کنید.
   - پچ اندپوینت‌های سرور را در `server.ts` اعمال کنید.

3. **انتقال P1.3 (پیام‌رسان و سوکت):**
   - پکیج `ws` را در پروژه مقصد نصب کنید: `npm install ws @types/ws`.
   - فایل‌های UI و سرویس را منتقل و کانفیگ سوکت را در سرور قرار دهید.

4. **انتقال P1.4 و P1.5 (فرانت‌اند عمومی و موبایل):**
   - کامپوننت‌های فرانت بدون اثر جانبی بک‌اند بوده و مستقیماً قابل وارد کردن به سورس کلاینت هستند.

5. **استقرار P1.6 (تجهیزات رادیوگرافی):**
   - اسکریپت `Configure-Win7RadiographySecurity.ps1` را روی ویندوز ۷ اجرا نموده و `RadiographyAgent.hta` را تنظیم کنید.
   - اسکریپت `setup-ncase3-radiography.sh` را روی سرور فیزیکی اوبونتو ۲۴ اجرا فرمایید.

6. **اجرای آزمون‌های پذیرش:**
   - پس از اعمال هر بسته، اسکریپت آزمون پذیرش همان پوشه زیر `tests/` را اجرا کنید تا از صحت رفتار اطمینان حاصل گردد.
