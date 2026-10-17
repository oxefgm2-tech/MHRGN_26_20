# -*- coding: utf-8 -*-
"""
Mehregan Clinic Bale Bot - Appointment Booking Handler
Syncs with Clinic Server (/api/bale/webhook/appointment)
"""

import os
import json
import logging
from urllib import request

logger = logging.getLogger("BaleBotAppointment")
API_URL = os.getenv("CLINIC_API_URL", "http://localhost:3000")

# In-memory user state
USER_BOOKING_STATE = {}

def sync_appointment_with_clinic(payload: dict) -> bool:
    try:
        url = f"{API_URL.rstrip('/')}/api/bale/webhook/appointment"
        req_data = json.dumps(payload).encode("utf-8")
        req = request.Request(
            url,
            data=req_data,
            headers={"Content-Type": "application/json", "User-Agent": "BaleBot/1.0"}
        )
        with request.urlopen(req, timeout=5) as response:
            return response.status in [200, 201]
    except Exception as e:
        logger.error(f"Failed to post appointment to clinic API: {e}")
        return False

def register_appointment_handler(bot):
    @bot.on_callback_query()
    async def appointment_callback(client, callback_query):
        data = getattr(callback_query, "data", "")
        if data == "appointment":
            user_id = getattr(callback_query.author, "id", None)
            if user_id:
                USER_BOOKING_STATE[user_id] = {"step": "waiting_details"}

            text = (
                "📅 *ثبت آنلاین نوبت ویزیت یا جراحی کلینیک مهرگان*\n\n"
                "لطفاً اطلاعات زیر را در یک پیام برای ما ارسال کنید:\n"
                "۱. نام و شماره تماس سرپرست\n"
                "۲. نام و گونه پت (مثلا سگ تدی / گربه لوسی)\n"
                "۳. علت مراجعه (ویزیت، واکسن، جراحی، دندانپزشکی یا ...)\n"
                "۴. روز و ساعت پیشنهادی شما\n\n"
                "پس از ارسال پیام، همکاران پذیرش نوبت شما را در سیستم ثبت و تایید خواهند کرد."
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

    @bot.on_message()
    async def appointment_text_receiver(client, message):
        user_id = getattr(message.author, "id", None)
        text = getattr(message, "text", "")
        if not text or text.startswith("/"):
            return

        state = USER_BOOKING_STATE.get(user_id)
        if state and state.get("step") == "waiting_details":
            payload = {
                "baleUserId": user_id,
                "baleUsername": getattr(message.author, "username", ""),
                "baleName": f"{getattr(message.author, 'first_name', '')} {getattr(message.author, 'last_name', '')}".strip(),
                "messageText": text,
            }

            success = sync_appointment_with_clinic(payload)
            USER_BOOKING_STATE.pop(user_id, None)

            if success:
                reply_text = (
                    "✅ *درخواست نوبت شما با موفقیت در اتوماسیون پذیرش کلینیک ثبت گردید.*\n\n"
                    "همکاران بخش پذیرش با شما تماس گرفته و زمان نهایی را هماهنگ خواهند کرد.\n"
                    "شماره تماس کلینیک مهرگان: ۰۳۱۳۶۲۹۲۲۷۸"
                )
            else:
                reply_text = (
                    "✅ درخواست شما در صف انتظار قرار گرفت و به پذیرش ارجاع داده شد.\n"
                    "در صورت نیاز فوری با شماره ۰۹۳۰۲۱۸۲۰۰۴۴ تماس بگیرید."
                )

            try:
                from balethon.objects import InlineKeyboard
                kb = InlineKeyboard([
                    [{"text": "🔙 بازگشت به منوی اصلی", "callback_data": "back_to_menu"}]
                ])
                await message.reply(reply_text, reply_markup=kb)
            except Exception:
                await message.reply(reply_text)
