# -*- coding: utf-8 -*-
"""
Mehregan Clinic Bale Bot - Working Hours Handler
"""

import json
from pathlib import Path

HOURS_PATH = Path(__file__).parent.parent.parent / "config" / "working_hours.json"

def load_working_hours():
    if HOURS_PATH.exists():
        try:
            with open(HOURS_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def register_working_hours_handler(bot):
    @bot.on_callback_query()
    async def working_hours_callback(client, callback_query):
        data = getattr(callback_query, "data", "")
        if data == "working_hours":
            hours = load_working_hours()
            text = (
                "⏰ *ساعات کاری کلینیک اختصاصی حیوانات خانگی مهرگان*\n\n"
                "🗓 *شنبه تا چهارشنبه (درمانی):* ۰۹:۰۰ صبح الی ۰۲:۰۰ بامداد\n"
                "🗓 *پنج‌شنبه‌ها (درمانی):* ۰۹:۰۰ صبح الی ۲۱:۳۰ شب\n"
                "🗓 *جمعه‌ها (درمانی):* ۱۰:۰۰ الی ۱۴:۰۰ و ۱۷:۰۰ الی ۰۲:۰۰ بامداد\n"
                "🗓 *پت‌شاپ:* شنبه تا پنج‌شنبه ۰۹:۰۰ الی ۲۱:۳۰ | جمعه ۱۷:۰۰ الی ۲۱:۳۰\n\n"
                "🚨 *بخش اورژانس و مراقبت‌های ویژه (ICU):*\n"
                "به‌صورت شبانه‌روزی ۲۴ ساعته فعال است.\n"
                "شماره تماس کشیک اورژانس: ۰۹۳۰۲۱۸۲۰۰۴۴"
            )
            try:
                from balethon.objects import InlineKeyboard
                kb = InlineKeyboard([
                    [{"text": "📅 ثبت نوبت آنلاین", "callback_data": "appointment"}],
                    [{"text": "🔙 بازگشت به منوی اصلی", "callback_data": "back_to_menu"}]
                ])
                await callback_query.message.edit_text(text, reply_markup=kb)
            except Exception:
                await callback_query.message.reply(text)
            await callback_query.answer()
