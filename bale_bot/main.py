#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mehregan Vet Clinic - Official Bale Messenger Bot
Powered by Balethon & DeepSeek AI
"""

from pathlib import Path
import sys
import os
from dotenv import load_dotenv

# Search for .env in current directory or parent directory
env_path = Path(__file__).parent / ".env"
if not env_path.exists():
    env_path = Path(__file__).parent.parent / ".env"

load_dotenv(env_path)

# Ensure bale_bot package is importable
sys.path.insert(0, str(Path(__file__).parent))

from balethon import Client

BALE_BOT_TOKEN = os.getenv("BALE_BOT_TOKEN")

if not BALE_BOT_TOKEN:
    print("❌ خطا: توکن ربات بله (BALE_BOT_TOKEN) تنظیم نشده است.")
    print("لطفاً فایل .env را با متغیر BALE_BOT_TOKEN تنظیم نمایید.")
    sys.exit(1)

bot = Client(BALE_BOT_TOKEN)

try:
    from bot.handlers.start import register_start_handler
    from bot.handlers.menu import register_menu_handler
    from bot.handlers.clinic_info import register_clinic_info_handler
    from bot.handlers.services import register_services_handler
    from bot.handlers.operator import register_operator_handler
    from bot.handlers.emergency import register_emergency_handler
    from bot.handlers.consultation import register_consultation_handler
    from bot.handlers.appointment import register_appointment_handler
    from bot.handlers.working_hours import register_working_hours_handler

    register_start_handler(bot)
    register_menu_handler(bot)
    register_clinic_info_handler(bot)
    register_services_handler(bot)
    register_operator_handler(bot)
    register_emergency_handler(bot)
    register_consultation_handler(bot)
    register_appointment_handler(bot)
    register_working_hours_handler(bot)

    print("✅ تمام هندلرهای بازوی بله با موفقیت بارگذاری شدند.")
except ImportError as e:
    print(f"⚠️ هندلرهای محلی در دسترس نیستند یا ماژول‌های پایتون ناقص هستند: {e}")
    print("در حال اجرای حالت آماده‌به‌کار (Standby Mode)...")

print("🐾 بازوی هوشمند کلینیک اختصاصی حیوانات خانگی مهرگان راه‌اندازی شد!")
print("برای توقف ربات کلید ترکیبی Ctrl+C را فشار دهید.")

if __name__ == "__main__":
    bot.run() # type: ignore
