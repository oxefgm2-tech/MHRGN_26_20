# پیکربندی سرور DICOM Store SCP (Orthanc PACS) کلینیک مهرگان

## ۱. مشخصات دستگاه رادیوگرافی کلینیک
- **دستگاه CR دیجیتال:** FUJIFILM CR-IR 392 (FCR PRIMA T2)
- **شماره سریال:** 36662067
- **پروتکل ارتباطی:** DICOM 3.0 (C-STORE Service Class User / SCU)
- **مولد اشعه ایکس:** TOSHIBA KCD-10M-7 (آنالوگ، فاقد اینترفیس DICOM، متصل به عنوان منبع تابش FCR)

## ۲. مشخصات سرور دریافت DICOM (Orthanc PACS)
- **نرم‌افزار SCP:** Orthanc DICOM Server (سبک، متن‌باز، سازگار با لینوکس اوبونتو و ویندوز)
- **Application Entity Title (AET):** `MEHREGAN_PACS`
- **پورت DICOM استاندارد:** `104` (یا پورت غیر ریشه `11112`)
- **پورت REST API اورثانک:** `8042`
- **حالت انتقال (Transfer Syntax):** Explicit VR Little Endian, Implicit VR Little Endian, JPEG Lossless

## ۳. تنظیمات کنسول فوجی FCR PRIMA T2
در منوی تنظیمات Maintenance کنسول فوجی:
1. **Destination AE Title:** `MEHREGAN_PACS`
2. **IP Address:** آدرس سرور کلینیک (مثلاً `192.168.1.100`)
3. **Port:** `11112`
4. **DICOM Services:** تیک گزینه `C-STORE Storage` فعال باشد.

## ۴. چرخه نگاشت REST به سیستم مدیریت کلینیک
1. کنسول FCR پس از اکسپوز و اسکن کاست، فایل را از طریق DICOM C-STORE به Orthanc ارسال می‌کند.
2. افزونه Lua یا وب‌هوک REST اورثانک (`/instances/{id}`) تگ‌های DICOM را به اندپوینت سرور کلینیک ارسال می‌کند:
   - `(0010,0020)` Patient ID ➔ شماره پرونده کلینیک
   - `(0010,0010)` Patient Name ➔ نام پت / مالک
   - `(0008,0018)` SOP Instance UID ➔ شناسه یکتای تصویر
   - `(0008,0060)` Modality ➔ `CR`
   - `(0018,1000)` Device Serial Number ➔ `36662067`
3. صف واحد `unifiedIngestQueue` تصویر را ثبت و از تکرار با پل فایل جلوگیری می‌کند.
