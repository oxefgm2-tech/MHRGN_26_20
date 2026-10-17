# -*- coding: utf-8 -*-
"""
Mehregan Clinic Bale Bot - Clinic Info & Navigation Handler
"""

import json
from pathlib import Path

INFO_PATH = Path(__file__).parent.parent.parent / "config" / "clinic_info.json"

def load_clinic_info():
    if INFO_PATH.exists():
        try:
            with open(INFO_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "name": "کلینیک اختصاصی حیوانات خانگی مهرگان",
        "address": "اصفهان، خیابان توحید میانی، حدفاصل مهرداد و شریعتی، کوچه مشکلانی ۲۲",
        "phone": "۰۳۱۳۶۲۹۲۲۷۸",
        "emergency_phone": "۰۹۳۰۲۱۸۲۰۰۴۴",
        "map_link": "https://maps.app.goo.gl/NjzpmkgHTuJJ9E2c9",
        "neshan_link": "https://neshan.org/maps/@32.6331396,51.6532624,17z",
        "balad_link": "https://balad.ir/location?latitude=32.6331396&longitude=51.6532624",
    }

def register_clinic_info_handler(bot):
    @bot.on_callback_query()
    async def clinic_info_callback(client, callback_query):
        data = getattr(callback_query, "data", "")
        if data == "clinic_info":
            info = load_clinic_info()
            text = (
                f"🏥 *{info.get('name')}*\n\n"
                f"📍 *نشانی:* {info.get('address')}\n"
                f"📞 *شماره تماس ثابت:* {info.get('phone')}\n"
                f"🚨 *شماره اورژانس شبانه‌روزی:* {info.get('emergency_phone')}\n\n"
                f"🗺 *مسیریابی هوشمند:* \n"
                f"• نشان: {info.get('neshan_link')}\n"
                f"• بلد: {info.get('balad_link')}\n"
                f"• گوگل مپس: {info.get('map_link')}\n"
            )
            try:
                from balethon.objects import InlineKeyboard
                kb = InlineKeyboard([
                    [{"text": "🔙 بازگشت به منوی اصلی", "callback_data": "back_to_menu"}]
                ])
                await callback_query.message.edit_text(text, reply_markup=kb)
            except Exception:
                await callback_query.message.reply(text)
            await callback_query.answer()
