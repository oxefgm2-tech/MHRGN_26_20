# -*- coding: utf-8 -*-
"""
Mehregan Clinic Bale Bot - Operator Handler
"""

def register_operator_handler(bot):
    @bot.on_callback_query()
    async def operator_callback(client, callback_query):
        data = getattr(callback_query, "data", "")
        if data == "operator":
            text = (
                "👨‍⚕️ *ارتباط با کارشناسان پذیرش و اپراتور مهرگان*\n\n"
                "برای صحبت با پرسنل پذیرش، پیگیری پرونده و نتایج آزمایش‌ها می‌توانید از راه‌های زیر استفاده فرمایید:\n\n"
                "☎️ تلفن مطب: ۰۳۱۳۶۲۹۲۲۷۸\n"
                "📱 پشتیبانی تلفنی: ۰۹۳۰۲۱۸۲۰۰۴۴\n"
                "💬 همچنین می‌توانید پیام متنی خود را همین‌جا در چت ارسال فرمایید تا توسط اپراتور بررسی گردد."
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
