# راهنمای جامع سه‌مُدی استقرار سامانه کلینیک دامپزشکی مهرگان
## Deployment Tri-Mode Operational Guide

این سند راهنمای عملیاتی و رسمی استقرار سامانه کلینیک دامپزشکی مهرگان در سه محیط مستقل معماری است.

---

### خلاصه ماتریس سه‌مُدی استقرار

| پارامتر / مشخصه | مُد ۱: شبکه محلی کلینیک (`lan_windows` / Local) | مُد ۲: سرور اختصاصی (`vps_ubuntu` / VPS) | مُد ۳: سامانه ابری (`cloud_hosted` / Cloud) |
| :--- | :--- | :--- | :--- |
| **وضعیت واقعی** | **[عملیاتی / پیش‌فرض کلینیک]** | **[عملیاتی / آنلاین]** | **[طرح مفهومی معماری]** |
| **میزبان و هاست** | کیس محلی کلینیک (`192.168.137.22` - LinuxServer) | سرور لینوکس ابری با دامنه معتبر | Google Cloud Run (Containerized) |
| **دامنه و دسترسی** | `http://192.168.137.22:3000` | `https://mehreganpetclinic.ir` | `https://ais-dev-mehregan.app` (طرح) |
| **پایگاه‌داده** | **فایل محلی JSON ایزوله** (`DATABASE_PROVIDER=json`) | **PostgreSQL 14** (`DATABASE_PROVIDER=postgres`، دیتابیس `mehregan_vet` با ۱۰ جدول) | Google Cloud SQL (Postgres) |
| **۱۰ جدول PostgreSQL** | نامربوط (ذخیره‌سازی درون clinic_store.json) | `patients`, `owners`, `appointments`, `medical_records`, `invoices`, `users`, `pet_shop_items`, `grooming_sessions`, `surgery_records`, `radiography_cases` | Cloud SQL Postgres Schema |
| **مسیر داده‌ها** | `DATA_DIR=/var/www/vetclinic/data` | `DATA_DIR=/var/www/vetclinic/data` | Bucket ذخیره‌سازی ابری / Object Store |
| **مسیر رادیوگرافی (ورودی الف)** | `RADIOGRAPHY_DIR=/var/www/vetclinic/data/radiography/incoming` | پشتیبان‌گیری پرونده‌ها و گراف‌ها | Cloud Bucket Ingest / Webhook |
| **پل فایل (ورودی ب)** | `RADIOGRAPHY_SOURCE_PATH=` (دینامیک از متغیر محیطی) | `RADIOGRAPHY_SOURCE_PATH=` (خالی) | API Direct Ingest |
| **سرویس DICOM C-STORE** | فعال روی پورت ۱۱۱۱۲ با AE Title `MEHREGAN_PACS` | فاقد اتصال سخت‌افزاری مستقیم کلینیک | فاقد ارتباط سخت‌افزاری مستقیم |
| **گواهی SSL** | ندارد (`useSsl=false` - شبکه ایزوله LAN) | دارد (Let's Encrypt Certbot روی Apache/Nginx) | مدیریت‌شده خودکار ابری (Google Managed SSL) |

---

### ۱. تعریف، تفاوت ساختاری و متغیرهای محیطی هر مُد

#### ۱.۱. مُد ۱: شبکه محلی کیس کلینیک (`lan_windows` / Local)
- **میزبان:** کیس سرور محلی با نام میزبان `LinuxServer` و آدرس IP ثابت `192.168.137.22`.
- **موتور پایگاه‌داده:** `DATABASE_PROVIDER=json` (کل اطلاعات در فایل ساختاریافته `/var/www/vetclinic/data/clinic_store.json` ذخیره و با هر عملیات اتمیک بر روی دیسک پایدار می‌شود).
- **اتصال رادیوگرافی:** سرویس Store SCP روی پورت ۱۱۱۱۲ با تایتل `MEHREGAN_PACS` فعال است و فایل‌های DICOM + Sidecar JSON + Preview PNG را در `RADIOGRAPHY_DIR` می‌نویسد.
- **متغیرهای محیطی کامل مُد محلی (`.env`):**
```env
PORT=3000
NODE_ENV=production
DEPLOYMENT_MODE=lan_windows
SERVER_IP=192.168.137.22
SERVER_DOMAIN=LinuxServer
LAN_SUBNET=192.168.137.0/24
DATABASE_PROVIDER=json
DATA_DIR=/var/www/vetclinic/data
RADIOGRAPHY_DIR=/var/www/vetclinic/data/radiography/incoming
RADIOGRAPHY_SOURCE_PATH=
RADIOGRAPHY_AE_TITLE=MEHREGAN_PACS
RADIOGRAPHY_PORT=11112
RADIOGRAPHY_HOST=localhost
USE_SSL=false
```

#### ۱.۲. مُد ۲: سرور مجازی اختصاصی (`vps_ubuntu` / VPS)
- **میزبان:** سرور لینوکس ابری با دامنه رسمی `https://mehreganpetclinic.ir`.
- **موتور پایگاه‌داده:** `DATABASE_PROVIDER=postgres` متصل به دیتابیس `mehregan_vet` شامل ۱۰ جدول رسمی:
  1. `patients` (پرونده بیماران و حیوانات)
  2. `owners` (مشخصات سرپرستان و اطلاعات تماس)
  3. `appointments` (نوبت‌های پذیرش و تقویم درمانی)
  4. `medical_records` (سوابق ویزیت و نسخه‌های دارویی)
  5. `invoices` (صورتحساب‌ها و تراکنش‌های مالی)
  6. `users` (پرسنل کلینیک، پزشکان و ماتریس دسترسی)
  7. `pet_shop_items` (محصولات و موجودی پت‌شاپ)
  8. `grooming_sessions` (سوابق شستشو و آرایش حیوانات)
  9. `surgery_records` (پرونده‌های جراحی و بیهوشی)
  10. `radiography_cases` (پرونده‌ها و لینک‌های گراف رادیولوژی)
- **متغیرهای محیطی کامل مُد VPS (`.env`):**
```env
PORT=3000
NODE_ENV=production
DEPLOYMENT_MODE=vps_ubuntu
SERVER_IP=185.36.145.243
SERVER_DOMAIN=mehreganpetclinic.ir
DATABASE_PROVIDER=postgres
DATABASE_URL=postgresql://postgres:StrongPassword@127.0.0.1:5432/mehregan_vet
DATA_DIR=/var/www/vetclinic/data
RADIOGRAPHY_DIR=/var/www/vetclinic/data/radiography/incoming
RADIOGRAPHY_SOURCE_PATH=
USE_SSL=true
```

#### ۱.۳. مُد ۳: سامانه ابری مقیاس‌پذیر (`cloud_hosted` / Cloud)
- **کاربرد:** [طرح مفهومی] استقرار بر بستر کانتینری Google Cloud Run با مقیاس‌پذیری خودکار و پایگاه داده Google Cloud SQL.
- **موتور پایگاه‌داده:** Cloud SQL PostgreSQL.
- **متغیرهای محیطی طرح ابری:**
```env
PORT=8080
NODE_ENV=production
DEPLOYMENT_MODE=cloud_hosted
DATABASE_PROVIDER=postgres
DATABASE_URL=postgresql://cloud_user:Secret@/mehregan_vet?host=/cloudsql/project:region:instance
USE_SSL=true
```

---

### ۲. مراحل تغییر وضعیت و سوییچ میان مُدها (Mode Switching)

۱. **تغییر از طریق متغیر محیطی (توصیه‌شده برای استقرار سیستمی):**
   - فایل `/var/www/vetclinic/.env` را ویرایش کرده و متغیرهای `DEPLOYMENT_MODE` و `DATABASE_PROVIDER` را طبق جدول بالا تنظیم فرمایید.
   - سرویس برنامه را بازنشانی کنید: `sudo systemctl restart mehregan-clinic`.

۲. **تغییر از طریق پنل مدیریت IT (داشبورد درون‌برنامه):**
   - مدیر سیستم به بخش «تنظیمات IT و معماری استقرار» (`DeploymentTopologySwitcher`) مراجعه می‌کند.
   - یکی از سه مُد را انتخاب و دکمه «ذخیره و اعمال تنظیمات» را کلیک می‌کند.
   - برنامه درخواست `POST /api/system/deployment-mode` را همراه با مقادیر جدید به سرور ارسال نموده و فایل `data/deployment_config.json` به صورت زنده بروزرسانی می‌گردد.

---

### ۲. پیش‌نیازها و پیکربندی شبکه

#### ۲.۱. پیش‌نیازهای کیس محلی (`192.168.137.22`)
- **سخت‌افزار:** پردازنده Core i5، رم ۴ گیگابایت، دیسک SSD با حداقل ۱۰ گیگابایت فضای خالی.
- **سیستم‌عامل و ران‌تایم:** Ubuntu 22.04 LTS / Debian با Node.js v20+ LTS و Python 3.10+.
- **پورت‌های باز فایروال (UFW):**
  - `3000/tcp`: وب‌سرور نود و API کلاینت.
  - `11112/tcp`: پروتکل DICOM C-STORE SCP (مجاز فقط برای ساب‌نت `192.168.137.0/24`).
- **بسته‌های سیستمی نصب‌شده:** `dcmtk`, `pydicom`, `numpy`, `PIL`.

#### ۲.۲. پیش‌نیازهای سرور VPS (`185.36.145.243`)
- **سخت‌افزار:** سرور مجازی ابری با حداقل ۲ هسته و ۴ گیگابایت رم.
- **سیستم‌عامل و وب‌سرور:** Ubuntu 22.04 LTS به همراه وب‌سرور Apache 2.4.
- **پایگاه‌داده:** PostgreSQL 14 با نام پایگاه‌داده `mehregan_vet` و دسترسی کاربر معتبر.
- **پورت‌های فایروال:**
  - `80/tcp` و `443/tcp`: وب و SSL عمومی.
  - `3000/tcp`: بایند محلی به `127.0.0.1:3000` (پشت پروکسی آپاچی).

---

### ۳. مراحل نصب و راه‌اندازی گام‌به‌گام

#### ۳.۱. استقرار روی کیس محلی (`192.168.137.22`)
```bash
# ۱. ایجاد مسیرهای استاندارد داده
sudo mkdir -p /var/www/vetclinic/data/radiography/{incoming,cases}
sudo mkdir -p /var/www/vetclinic/data/backups
sudo chown -R www-data:www-data /var/www/vetclinic/data
sudo chmod -R 2775 /var/www/vetclinic/data

# ۲. ایجاد فایل محیطی .env در مسیر پروژه
cat << 'EOF' > /var/www/vetclinic/.env
PORT=3000
DATABASE_PROVIDER=json
DATA_DIR=/var/www/vetclinic/data
RADIOGRAPHY_DIR=/var/www/vetclinic/data/radiography
DEPLOYMENT_MODE=lan_windows
SERVER_IP=192.168.137.22
SERVER_DOMAIN=mehregan.local
USE_SSL=false
AUTH_BOOTSTRAP_TOKEN=mpc-bootstrap-2026-secure-token-x7k9m2
EOF

# ۳. کپی باندل ساخته‌شده و اجرای سرویس
# پوشه‌های dist/server.cjs و dist/assets در مسیر مستقر می‌شوند.
node dist/server.cjs
```

#### ۳.۲. استقرار روی سرور VPS (`185.36.145.243`)
```bash
# ۱. پیکربندی وب‌سرور آپاچی (VirtualHost با Reverse Proxy)
sudo a2enmod proxy proxy_http proxy_wstunnel ssl rewrite headers

cat << 'EOF' | sudo tee /etc/apache2/sites-available/mehreganpetclinic.conf
<VirtualHost *:80>
    ServerName mehreganpetclinic.ir
    ServerAlias www.mehreganpetclinic.ir
    Redirect permanent / https://mehreganpetclinic.ir/
</VirtualHost>

<VirtualHost *:443>
    ServerName mehreganpetclinic.ir
    ServerAlias www.mehreganpetclinic.ir

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/mehreganpetclinic.ir/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/mehreganpetclinic.ir/privkey.pem

    # پروکسی وب‌سوکت
    ProxyPass /ws ws://127.0.0.1:3000/ws
    ProxyPassReverse /ws ws://127.0.0.1:3000/ws

    # پروکسی هسته اکسپرس
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/
</VirtualHost>
EOF

sudo a2ensite mehreganpetclinic.conf
sudo systemctl reload apache2
```

---

### ۴. تفاوت واقعی رفتار در هر مُد

| ویژگی عملکردی | مُد محلی (`lan_windows`) | مُد سرور (`vps_ubuntu`) | مُد ابری (`cloud`) |
| :--- | :--- | :--- | :--- |
| **هسته ذخیره‌سازی** | فایل JSON محلی | جداول PostgreSQL | شبیه‌ساز درون‌حافظه‌ای / موقت |
| **دریافت DICOM** | مستقیم روی پورت ۱۱۱۱۲ محلی | فاقد ارتباط با دستگاه‌های کلینیک | فاقد ارتباط سخت‌افزاری |
| **احراز هویت** | توکن Bearer محلی و کاربر پیش‌فرض | توکن رمزنگاری‌شده + نشست امن HTTPS | تست محلی |
| **ثبت پرونده ۹۱۸۱ بیمار** | با سرعت آنی خوانده‌شده از دیسک محلی | از دیتابیس پستگرس با کوئری‌های بهینه | آرایه پیش‌فرض |

---

### ۵. آزمون پذیرش صحت استقرار (Acceptance Smoke Tests)

برای بررسی درستی بالا آمدن سامانه در هر محیط، این دو دستور را اجرا فرمایید:
```bash
# آزمون سلامت هسته
curl -s http://127.0.0.1:3000/api/health
# خروجی مورد انتظار: {"success":true,"status":"ok",...}

# آزمون تنظیمات سه‌مُدی
curl -s http://127.0.0.1:3000/api/system/deployment-mode
# خروجی مورد انتظار شامل mode فعال و دیتابیس مربوطه
```

---

### ۶. عیب‌یابی رایج

1. **خطای عدم دسترسی به تصاویر رادیوگرافی:**
   - مطمئن شوید پوشه `/var/www/vetclinic/data/radiography/incoming` دارای دسترسی `2775` و انتساب به کاربر `www-data` است.
   - مطمئن شوید متغیر `RADIOGRAPHY_DIR` در فایل `.env` به درستی تنظیم شده باشد.
2. **قفل شدن پورت ۳۰۰۰:**
   - دستور `lsof -i :3000` را اجرا کرده و فرایند قبلی را متوقف فرمایید.
3. **عدم اتصال WebSocket در آپاچی VPS:**
   - ماژول `proxy_wstunnel` را در آپاچی فعال کنید: `sudo a2enmod proxy_wstunnel && sudo systemctl restart apache2`.
