# -*- coding: utf-8 -*-
"""
Mehregan Clinic Bale Bot - Main Menu Keyboard & Handler
"""

import json
from pathlib import Path

CONFIG_PATH = Path(__file__).parent.parent.parent / "config" / "menu.json"

def load_menu_config():
    if CONFIG_PATH.exists():
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "welcome_message": "سلام به بازوی هوشمند کلینیک اختصاصی حیوانات خانگی مهرگان خوش آمدید! 🐾\nلطفاً یکی از گزینه‌های زیر را انتخاب نمایید:",
        "buttons": [
            [
                {"text": "📅 ثبت نوبت آنلاین", "callback_data": "appointment"},
                {"text": "🏥 اطلاعات و آدرس کلینیک", "callback_data": "clinic_info"}
            ],
            [
                {"text": "📋 خدمات و تعرفه‌ها", "callback_data": "services"},
                {"text": "⏰ ساعات کاری و وضعیت", "callback_data": "working_hours"}
            ],
            [
                {"text": "🤖 مشاوره پزشکی هوشمند", "callback_data": "consultation"},
                {"text": "🚨 راهنمای اورژانس ۲۴ ساعته", "callback_data": "emergency"}
            ],
            [
                {"text": "👨‍⚕️ ارتباط مستقیم با اپراتور", "callback_data": "operator"}
            ]
        ]
    }

def get_menu_keyboard():
    try:
        from balethon.objects import InlineKeyboard
        cfg = load_menu_config()
        return InlineKeyboard(cfg.get("buttons", []))
    except Exception:
        return None

def register_menu_handler(bot):
    @bot.on_callback_query()
    async def handle_back_menu(client, callback_query):
        data = getattr(callback_query, "data", "")
        if data == "back_to_menu" or data == "main_menu":
            cfg = load_menu_config()
            kb = get_menu_keyboard()
            await callback_query.message.edit_text(cfg.get("welcome_message", "منوی اصلی کلینیک مهرگان:"), reply_markup=kb)
            await callback_query.answer()
