# -*- coding: utf-8 -*-
"""
Mehregan Clinic Bale Bot - Emergency Handler
"""

def register_emergency_handler(bot):
    @bot.on_callback_query()
    async def emergency_callback(client, callback_query):
        data = getattr(callback_query, "data", "")
        if data == "emergency":
            text = (
                "🚨 *پروتکل فوریت‌های اورژانس کلینیک مهرگان اصفهان*\n\n"
                "بخش مراقبت‌های ویژه (ICU) و اتاق عمل اورژانس کلینیک مهرگان به‌صورت ۲۴ ساعته شبانه‌روزی آماده پذیرش موارد تروما، تصادف، مسمومیت و مشکلات حاد تنفسی می‌باشد.\n\n"
                "📞 *تماس فوری با اورژانس:* ۰۹۳۰۲۱۸۲۰۰۴۴\n"
                "🏥 *آدرس:* اصفهان، خیابان توحید میانی، حدفاصل مهرداد و شریعتی، کوچه مشکلانی ۲۲\n\n"
                "⚠️ *اقدامات حیاتی اولیه:* \n"
                "۱. حیوان را در موقعیت آرام و بدون تکان شدید نگه دارید.\n"
                "۲. در موارد خونریزی با گاز تمیز فشار ملایم اعمال کنید.\n"
                "۳. از خوراندن داروهای انسانی بدون دستور جداً خودداری کنید."
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
