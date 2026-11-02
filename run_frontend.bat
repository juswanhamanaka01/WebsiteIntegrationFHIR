@echo off
title Frontend SIMRS RSUD ISTEK 'Aisyiyah Kendari - Port 5173
color 0a

cd /d "%~dp0frontend"
echo ======================================================================
echo    FRONTEND SIMRS RSUD ISTEK 'AISYIYAH KENDARI - PORT 5173
echo ======================================================================
echo URL Aplikasi : http://localhost:5173
echo ======================================================================
echo.

npm run dev
pause
