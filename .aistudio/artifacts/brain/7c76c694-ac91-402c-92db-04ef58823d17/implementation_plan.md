# سند نهایی طراحی و اجرای ده بند ابلاغی کلینیک دامپزشکی مهرگان

برنامهٔ جامع مهندسی برای همراستاسازی سامانه با واقعیت سخت‌افزاری و زیرساختی کیس محلی مهرگان (`192.168.137.22`) و سرور VPS (`185.36.145.243`) بر روی مخزن عملیاتی `Version5New`.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> با اعمال سه تصحیح الزامی ابلاغیهٔ سوم تیم سرور، مفروضات معماری به شرح زیر منجمد و قطعی شده‌اند:

- **تصحیح ۱ (آدرس شبکه):** آدرس کیس محلی در تمام دیاگرام‌ها، فایل‌های پیکربندی و پنل‌ها منحصراً `192.168.137.22` است (نه ۱۰.۱۳۷.۲۲).
- **تصحیح ۲ (مسیر رادیوگرافی):** مسیر فایل‌ها به هیچ عنوان هاردکد نمی‌شود. متغیر `RADIOGRAPHY_DIR = process.env.RADIOGRAPHY_DIR || path.join(DATA_DIR, 'radiography')` مبنای یکتای دسترسی دیسک است. پوشه فایل‌های ورودی در `incoming/` قرار دارد و مسیرهای هاردکد قبلی نظیر `/srv/radiography/incoming` یا `C:\Radiography\Export` به‌طور کامل از سرور و کلاینت ریشه‌کن می‌شوند.
- **تصحیح ۳ (مرز مسئولیت رادیوگرافی):** پردازش DICOM به PNG بر عهده تیم زیرساخت سرور است (تولید سه فایل `.dcm`، `.json` و `.png`). لایه Node.js در بک‌اند هیچ پارسر DICOM یا مبدل تصویری را اجرا نمی‌کند؛ تنها فایل‌های `.json` با قرارداد منجمد را اسکن و فایل `.png` مربوطه را به ویوور کلاینت استریم می‌نماید.
- **ویوور سبک آفلاین:** به دلیل محدودیت سخت‌افزاری کیس کلینیک (Core i5 با ۴ گیگابایت رم)، ویوور از بارگذاری موتورهای حجیم WASM نظیر Cornerstone3D پرهیز کرده و مستقیماً پیش‌نمایش `.png` را با ابزارهای بهینه CSS (Zoom, Pan, Invert, Contrast) نمایش می‌دهد.
- **مجازی‌سازی P0 پرونده‌ها:** رندر همزمان ۹۱۸۱ کارت پرونده در `ReceptionPetsTab` و `MedicalRecordsTab` با تکنیک DOM Windowing جایگزین می‌شود تا تعداد گره‌های فعال به زیر ۵۰ کاهش یافته و قفل مرورگر رفع شود.
- **استقلال آفلاین:** فونت Vazirmatn در `public/fonts/` مستقر و تمام ارجاعات CDN و تصاویر خارجی Unsplash (شمارش ۵۱ مورد) با دارایی‌های محلی جایگزین می‌گردند.

---

### ۱. معماری سیستم و جریان داده

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   Hardware & Clinical DICOM Source                     │
│               (FUJIFILM FCR PRIMA T2 / CR-IR 392 Console)              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ DICOM C-STORE (:11112)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             mehregan-dicom-scp (storescp + server sidecar)             │
│    Writes 3 files to RADIOGRAPHY_DIR/incoming/ (192.168.137.22)        │
│       1. <SOPUID>.dcm   2. <SOPUID>.json (Frozen)   3. <SOPUID>.png    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Local Disk Scan / JSON Read
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Mehregan Core Backend (Express)                    │
│                                                                        │
│  • RADIOGRAPHY_DIR = process.env.RADIOGRAPHY_DIR                       │
│                      || path.join(DATA_DIR, 'radiography')             │
│  • GET /api/radiography/incoming  ──► Scans <SOPUID>.json sidecars     │
│  • GET /api/radiography/preview/:id ─► Streams <SOPUID>.png            │
│  • Zero DICOM parsing in Node · Zero Fake Stubs · Zero ncase3          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON / Image Stream
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Mehregan Client Frontend                         │
│                                                                        │
│  ┌───────────────────────┐                 ┌────────────────────────┐  │
│  │ Reception & Medical   │                 │ Radiography Modal      │  │
│  │ (DOM Windowing <50)   │                 │ (Lightweight PNG View) │  │
│  └───────────────────────┘                 └────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Trimode Deployment Manager (Display & Operational Switch)        │  │
│  │ [LAN: 192.168.137.22 | VPS: 185.36.145.243 | Cloud: Plan/Mock]   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

### ۲. طرح اجرای ده بند ابلاغی

#### بند ۱ — قرارداد sidecar DICOM و پاکسازی ماک‌ها
- **در `server.ts`:**
  - حذف مسیرهای هاردکد و تعیین مسیر یکتا:
    ```typescript
    const RADIOGRAPHY_DIR = process.env.RADIOGRAPHY_DIR
      ? path.resolve(process.env.RADIOGRAPHY_DIR)
      : path.join(DATA_DIR, 'radiography');
    const RADIOGRAPHY_INCOMING_DIR = path.join(RADIOGRAPHY_DIR, 'incoming');
    const RADIOGRAPHY_CASES_DIR = path.join(RADIOGRAPHY_DIR, 'cases');
    ```
  - بازنویسی کامل `/api/radiography/incoming`:
    - اسکن پوشه `RADIOGRAPHY_INCOMING_DIR` برای فایل‌های با پسوند `.json`.
    - پارس هر فایل و استخراج فیلدهای منجمد:
      `sopInstanceUid`, `patientId`, `patientName`, `studyDate`, `modality`, `studyDescription`, `seriesNumber`, `instanceNumber`, `receivedAt`, `file`, `preview`.
    - در صورت نبود فایل: بازگرداندن آرایه خالی `{ success: true, count: 0, files: [] }`.
    - حذف کامل و قطعی کدهای نمونه جعلی (`rad-lucy-01`, `XR_20261008`, `rad-max-02`, `rad-teddy-03`).
  - روت استریم تصویر `/api/radiography/preview/:filename`: ارسال مستقیم فایل PNG با هدر کش مناسب و بررسی امنیتی مسیر (`path.basename`).
  - پاکسازی `radiographyConfig` در سرور و دیتابیس استور از مقادیر `C:\Radiography\Export` و `ncase3`.

#### بند ۲ — ویوور سبک رادیوگرافی (Lightweight Viewer)
- **در `RadiographyModal.tsx`:**
  - استفاده از تگ استاندارد تصویر با لایه کنترل‌های بهینه CSS:
    - بزرگنمایی (Zoom)، جابه‌جایی تصویر (Pan)، معکوس‌سازی رنگ نگاتیو/پوزتیو (`filter: invert(1)`).
    - اسلایدرهای روان Contrast و Brightness با CSS Filters.
  - در صورت خالی بودن صف رادیوگرافی: نمایش باکس بازخورد بالینی با پیام «هنوز تصویری از دستگاه دریافت نشده است».
  - بدون بارگذاری WASM و با مصرف حافظه زیر ۳۰ مگابایت در تب مرورگر.

#### بند ۳ — مجازی‌سازی لیست پرونده‌ها [P0]
- **در `ReceptionPetsTab.tsx` و `MedicalRecordsTab.tsx`:**
  - پیاده‌سازی مکانیزم پنجره‌بندی (Virtual Windowing) با محاسبات Native React بدون ریسک وابستگی‌های ناسازگار:
    - نگه داشتن کل ۹۱۸۱ پرونده در حافظه برای فیلتر و جستجوی آنی.
    - محاسبه ارتفاع کارت‌ها (~۱۴۰px) و تشخیص محدوده نمایان کانتینر اسکرول (`scrollTop`, `clientHeight`).
    - محاسبه `startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer)`.
    - محاسبه `endIndex = Math.min(totalCount, Math.ceil((scrollTop + clientHeight) / rowHeight) + buffer)`.
    - رندر یک المان نگهدارنده کل ارتفاع و رندر صرفاً ۲۰ الی ۳۰ کارت جاری.
  - تعداد نودهای DOM همواره زیر ۵۰ گره خواهد بود؛ فریز شدن مرورگر به صفر می‌رسد و اسکرول ۶۰fps تضمین می‌شود.

#### بند ۴ — حذف وابستگی‌های خارجی و هاردکدها
- **فونت محلی Vazirmatn:**
  - قرار دادن فایل‌های فونت در `public/fonts/`.
  - تنظیم قواعد `@font-face` در استایل‌های عمومی.
  - حذف لینک‌های خارجی Google Fonts و jsdelivr از `index.html`.
- **جایگزینی ۵۱ ارجاع Unsplash:**
  - جایگزینی تمام آدرس‌های `images.unsplash.com` با SVG آیکون‌های بالینی تمیز و دارایی‌های محلی در `public/assets/`.
- **پاکسازی مقادیر هاردکد:**
  - صفر کردن ارجاع به `C:\Radiography\Export` و `ncase3` در تمام مخزن.

#### بند ۵ — مهار اسپینرهای ماندگار و Polling
- **کنترل تایم‌اوت:**
  - افزودن Timeout ۵ ثانیه‌ای روی تمام ارتباطات دوربین، DVR و هوش مصنوعی.
  - نمایش کارت «سرویس محلی آفلاین» همراه با دکمه تلاش مجدد در صورت عدم پاسخگویی.
- **توقف Polling در تب غیرفعال:**
  - شنود `visibilitychange` و تعلیق تایمرهای درخواست سرور هنگام Minimise یا جابجایی تب.

#### بند ۶ و ۷ — راهنمای سه‌مُدی و پنل مدیریت سه‌مُدی
- **مستند `docs/DEPLOYMENT-TRIMODE-GUIDE.md`:**
  - تشریح سه مُد:
    1. `lan_windows` (کیس محلی ۱۰.۱۳۷.۲۲ غلط است؛ دقیقاً `192.168.137.22` با دیتابیس `embedded_json`).
    2. `vps_ubuntu` (سرور `185.36.145.243` با دامنه `mehreganpetclinic.ir`، وب‌سرور Apache و دیتابیس PostgreSQL 14).
    3. `cloud` (برچسب صریح «طرح/غیرفعال»).
- **پنل سه‌مُدی با سوئیچ دوحالته:**
  - *حالت نمایشی (Display Mode):* مشاهده مقادیر استاندارد و ایده‌آل هر سه مُد (فقط خواندنی).
  - *حالت کاربردی (Operational Mode):* ارتباط زنده با روت `/api/system/deployment-mode`، نمایش مقادیر واقعی فعال و قابلیت ذخیره‌سازی با تاییدیه صریح مدیر.

#### بند ۸ — تکمیل ویرایشگر ساعات کاری و مهار RBAC
- **بررسی گرپ منفی:** اطمینان از عدم وجود رشته‌های «۲۳:۳۰»، «۸:۰۰ الی» و «۲۴ ساعته».
- **ویرایشگر مدیر در `ClinicProfileSettingsModal.tsx`:**
  - درج برچسب صریح: «در صورتی که ساعت پایان کوچکتر از ساعت شروع باشد، بازه شبانه تا بامداد روز بعد ادامه دارد».
  - دکمه اختصاصی «بازگرداندن به پیش‌فرض واقعی کلینیک مهرگان».
  - محدودسازی ذخیره به مجوز `settings.manage` (فقط `admin` و `it_developer`) در فرانت‌اند و اعتبارسنجی سمت سرور در `POST /api/clinic/profile`.

#### بند ۹ و ۱۰ — همراستاسازی مستندات و روش تحویل
- **همراستاسازی فایل‌های مستندات:** به‌روزرسانی جدول «وضعیت واقعی» در اسناد اصلی مخزن.
- **بیلد نهایی:** اجرای `npm run build` جهت آماده‌سازی فایل مستقل `dist/server.cjs` و دارایی‌های `dist/assets` برای استقرار مستقیم روی کیس `192.168.137.22`.
- **گزارش نهایی:** ارائه خروجی خام آزمون‌ها و فهرست فایل‌های تغییریافته با برچسب‌های چهارگانه.
