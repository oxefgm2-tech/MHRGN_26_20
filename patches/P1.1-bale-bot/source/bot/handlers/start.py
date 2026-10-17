# -*- coding: utf-8 -*-
"""
Mehregan Clinic Bale Bot - Start Command Handler
"""

from bot.handlers.menu import load_menu_config, get_menu_keyboard

def register_start_handler(bot):
    @bot.on_message(at_the_beginning="/start")
    async def start_handler(client, message):
        cfg = load_menu_config()
        text = cfg.get("welcome_message", "سلام به بازوی هوشمند کلینیک اختصاصی حیوانات خانگی مهرگان خوش آمدید! 🐾")
        kb = get_menu_keyboard()
        await message.reply(text, reply_markup=kb)

    @bot.on_message(at_the_beginning="/help")
    async def help_handler(client, message):
        help_text = (
            "راهنمای بازوی پیام‌رسان بله کلینیک مهرگان:\n"
            "• برای مشاهده منو: دستور /start یا /menu\n"
            "• برای ثبت نوبت: دکمه 'ثبت نوبت آنلاین'\n"
            "• برای آدرس و لوکیشن: دکمه 'اطلاعات و آدرس'\n"
            "• تماس با اورژانس: 093021820044"
        )
        await message.reply(help_text, reply_markup=get_menu_keyboard())

    @bot.on_message(at_the_beginning="/menu")
    async def menu_handler(client, message):
        cfg = load_menu_config()
        await message.reply(cfg.get("welcome_message", "منوی اصلی"), reply_markup=get_menu_keyboard())
