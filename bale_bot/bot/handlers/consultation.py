# -*- coding: utf-8 -*-
"""
Mehregan Clinic Bale Bot - Medical Consultation Handler
"""

def register_consultation_handler(bot):
    @bot.on_callback_query()
    async def consultation_callback(client, callback_query):
        data = getattr(callback_query, "data", "")
        if data == "consultation":
            text = (
                "🤖 *مشاوره هوشمند دامپزشکی مهرگان*\n\n"
                "جهت دریافت راهنمایی اولیه، لطفاً علائم بالینی، سن و گونه پت دلبندتان (سگ، گربه، پرنده و ...) را شرح دهید.\n\n"
                "📌 *نکته مهم بالینی:* مشاوره هوشمند یا آنلاین جایگزین معاینه حضوری و پاراکلینیکی پزشک نمی‌باشد. در شرایط بی‌حالی شدید، تنگی نفس یا تشنج، فوراً به بخش اورژانس مراجعه فرمایید."
            )
            try:
                from balethon.objects import InlineKeyboard
                kb = InlineKeyboard([
                    [{"text": "📅 ثبت نوبت معاینه حضوری", "callback_data": "appointment"}],
                    [{"text": "🔙 بازگشت به منوی اصلی", "callback_data": "back_to_menu"}]
                ])
                await callback_query.message.edit_text(text, reply_markup=kb)
            except Exception:
                await callback_query.message.reply(text)
            await callback_query.answer()
