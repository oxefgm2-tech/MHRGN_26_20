# -*- coding: utf-8 -*-
"""
Mehregan Clinic Bale Bot - Services & Pricing Handler
"""

import json
from pathlib import Path

SERVICES_PATH = Path(__file__).parent.parent.parent / "config" / "services.json"

def load_services():
    if SERVICES_PATH.exists():
        try:
            with open(SERVICES_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"categories": []}

def register_services_handler(bot):
    @bot.on_callback_query()
    async def services_callback(client, callback_query):
        data = getattr(callback_query, "data", "")
        if data == "services":
            srv = load_services()
            lines = ["📋 *لیست خدمات و بخش‌های تخصصی کلینیک مهرگان:*\n"]
            for cat in srv.get("categories", []):
                lines.append(f"🔹 *{cat.get('title')}*")
                for item in cat.get("services", [])[:3]:
                    lines.append(f"  • {item.get('name')}: {item.get('price')}")
                lines.append("")

            lines.append("جهت استعلام دقیق‌تر یا جراحی‌های تخصصی با شماره کلینیک تماس بگیرید.")
            text = "\n".join(lines)
            
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
