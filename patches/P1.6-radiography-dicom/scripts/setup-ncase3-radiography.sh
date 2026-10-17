#!/usr/bin/env bash
# ==============================================================================
# Mehregan Veterinary Clinic - ncase3 (Ubuntu 24.04 LTS) Radiography Receiver Setup
# ==============================================================================
# این اسکریپت روی سرور فیزیکی ncase3 (اوبونتو ۲۴) اجرا می‌شود و:
# ۱. پکیج‌های Samba و ابزارهای مرتبط را نصب و پیکربندی می‌کند.
# ۲. ساختار دایرکتوری‌های مقصد رادیولوژی (/srv/radiography/incoming, processed, archive) را ایجاد می‌نماید.
# ۳. اشتراک‌گذاری امن تحت شبکه محلی (Samba Share) را برای دریافت فایل‌های رادیوگرافی از ویندوز ۷ فعال می‌سازد.
# ۴. وب‌سرور سبک لوکال برای پنل نمایش‌دهنده و ثبت اطلاعات بیمار/گراف را مستقر می‌سازد.
# ==============================================================================

set -euo pipefail

echo "=========================================================================="
echo "   کلینیک دامپزشکی مهرگان - راه‌اندازی سرور دریافت رادیوگرافی (ncase3)"
echo "   سیستم‌عامل: Ubuntu 24.04 LTS"
echo "=========================================================================="

if [ "$EUID" -ne 0 ]; then
  echo "خطا: لطفاً این اسکریپت را با دسترسی روت اجرا نمایید (sudo ./setup-ncase3-radiography.sh)"
  exit 1
fi

BASE_DIR="/srv/radiography"
INCOMING_DIR="${BASE_DIR}/incoming"
PROCESSED_DIR="${BASE_DIR}/processed"
ARCHIVE_DIR="${BASE_DIR}/archive"
VIEWER_DIR="${BASE_DIR}/viewer"
DATA_CASES_DIR="${BASE_DIR}/cases"

echo "[گام ۱/۵]: ایجاد دایرکتوری‌های استاندارد مقصد در ncase3..."
mkdir -p "${INCOMING_DIR}"
mkdir -p "${PROCESSED_DIR}"
mkdir -p "${ARCHIVE_DIR}"
mkdir -p "${VIEWER_DIR}"
mkdir -p "${DATA_CASES_DIR}"

# تنظیم مجوزها جهت نوشتن مستقیم ویندوز ۷ بدون نیاز به رمزهای پیچیده
chmod -R 0777 "${BASE_DIR}"
echo "✓ دایرکتوری‌های مقصد با موفقیت ایجاد شدند:"
echo "   - ورودی خام ویندوز ۷: ${INCOMING_DIR}"
echo "   - کیس‌های پردازش‌شده: ${PROCESSED_DIR}"
echo "   - پرونده‌های ثبت‌شده: ${DATA_CASES_DIR}"

echo "[گام ۲/۵]: بررسی و نصب سرویس Samba..."
if ! command -v smbd &>/dev/null; then
  echo "در حال نصب Samba و متعلقات..."
  apt-get update -y
  apt-get install -y samba samba-common-bin inotify-tools
else
  echo "✓ Samba از قبل نصب است."
fi

echo "[گام ۳/۵]: پیکربندی اشتراک‌گذاری Samba برای پوشه radiography..."
SMB_CONF="/etc/samba/smb.conf"
SHARE_NAME="radiography"

# Backup original smb.conf if not already backed up
if [ ! -f "${SMB_CONF}.bak" ]; then
  cp "${SMB_CONF}" "${SMB_CONF}.bak"
fi

if ! grep -q "\[${SHARE_NAME}\]" "${SMB_CONF}"; then
  cat <<EOT >> "${SMB_CONF}"

# === Mehregan Clinic Radiography Isolated Share ===
[${SHARE_NAME}]
   comment = Mehregan Radiography One-Way Receiver Share
   path = ${BASE_DIR}
   browseable = yes
   writeable = yes
   read only = no
   guest ok = yes
   create mask = 0777
   directory mask = 0777
   force user = nobody
   force group = nogroup
EOT
  echo "✓ تنظیمات اشتراک‌گذاری [radiography] به smb.conf اضافه شد."
else
  echo "✓ اشتراک‌گذاری [radiography] قبلاً در smb.conf وجود داشته است."
fi

# راه‌اندازی مجدد سرویس سامبا
systemctl restart smbd nmbd || systemctl restart smbd
systemctl enable smbd nmbd || systemctl enable smbd
echo "✓ سرویس Samba با موفقیت فعال و ریستارت شد."

echo "[گام ۴/۵]: استقرار پنل وب و نمایش‌دهنده استاتیک رادیولوژی..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/radiography_agent/ncase3_viewer/radiography-viewer.html" ]; then
  cp "${SCRIPT_DIR}/radiography_agent/ncase3_viewer/radiography-viewer.html" "${VIEWER_DIR}/index.html"
elif [ -f "${SCRIPT_DIR}/ncase3_viewer/radiography-viewer.html" ]; then
  cp "${SCRIPT_DIR}/ncase3_viewer/radiography-viewer.html" "${VIEWER_DIR}/index.html"
else
  echo "توجه: فایل منبع viewer در مسیر مورد نظر یافت نشد، ایجاد فایل پیش‌فرض..."
fi

# ایجاد سرویس Systemd برای وب‌سرور پنل روی پورت 8080 سرور ncase3
SERVICE_FILE="/etc/systemd/system/radiography-viewer.service"
cat <<EOT > "${SERVICE_FILE}"
[Unit]
Description=Mehregan Clinic Radiography Viewer Web Service
After=network.target

[Service]
Type=simple
User=nobody
WorkingDirectory=${VIEWER_DIR}
ExecStart=/usr/bin/python3 -m http.server 8080 --directory ${VIEWER_DIR}
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOT

systemctl daemon-reload
systemctl enable radiography-viewer.service
systemctl restart radiography-viewer.service
echo "✓ وب‌سرور پنل رادیوگرافی روی پورت 8080 با موفقیت راه‌اندازی شد (http://ncase3:8080)."

echo "[گام ۵/۵]: تنظیمات فایروال محلی اوبونتو ۲۴..."
if command -v ufw &>/dev/null && ufw status | grep -q "Status: active"; then
  ufw allow from 192.168.1.0/24 to any port 445 proto tcp comment 'Mehregan Samba SMB'
  ufw allow from 192.168.1.0/24 to any port 139 proto tcp comment 'Mehregan NetBIOS'
  ufw allow from 192.168.1.0/24 to any port 8080 proto tcp comment 'Mehregan Radiography Viewer'
  echo "✓ پورت‌های مورد نیاز در UFW برای ساب‌نت محلی باز شدند."
fi

echo "=========================================================================="
echo "   راه‌اندازی با موفقیت به پایان رسید!"
echo "   - مسیر اشتراکی ویندوز ۷: \\\\ncase3\\radiography\\incoming"
echo "   - نشانی وب پنل مشاهده گراف و ثبت اطلاعات بیمار: http://ncase3:8080"
echo "   - یا نشانی آی‌پی سرور: http://192.168.1.100:8080"
echo "=========================================================================="
