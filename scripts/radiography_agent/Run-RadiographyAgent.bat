@echo off
chcp 65001 >nul
title Mehregan Clinic Radiography Agent (Windows 7)
echo =======================================================================
echo    Mehregan Veterinary Clinic - Radiography Agent
echo    راه اندازی پنل خودکار کپی گراف به سرور فیزیکی ncase3
echo =======================================================================
echo.

:: Ensure destination and agent folders exist
if not exist "C:\Radiography\Export" mkdir "C:\Radiography\Export"
if not exist "C:\Radiography\Agent" mkdir "C:\Radiography\Agent"

:: Copy HTA to agent folder if run from another place
copy /Y "%~dp0RadiographyAgent.hta" "C:\Radiography\Agent\RadiographyAgent.hta" >nul 2>&1

echo در حال اجرای پنل رادیوگرافی در ویندوز ۷...
start "" mshta.exe "C:\Radiography\Agent\RadiographyAgent.hta"
echo پنل با موفقیت باز شد.
