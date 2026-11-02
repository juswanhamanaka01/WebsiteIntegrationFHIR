@echo off
title SIMRS RSUD ISTEK 'Aisyiyah Kendari - E-Health (Kelompok 3)
color 0a

echo ======================================================================
echo    RSUD ISTEK 'AISYIYAH KENDARI - SISTEM INFORMASI E-HEALTH
echo    MODUL INTEGRASI REKAM MEDIS ELEKTRONIK (HL7 FHIR R4) - KELOMPOK 3
echo ======================================================================
echo.

cd /d "%~dp0"

echo [1/2] Menjalankan Server Backend FastAPI (Port 8000)...
start "Backend SIMRS RSUD ISTEK 'Aisyiyah Kendari" cmd /k "cd /d ""%~dp0"" && call run_backend.bat"

echo [2/2] Menjalankan Server Frontend React Vite (Port 5173)...
start "Frontend SIMRS RSUD ISTEK 'Aisyiyah Kendari" cmd /k "cd /d ""%~dp0"" && call run_frontend.bat"

echo.
echo Menunggu layanan siap dan membuka peramban dalam 3 detik...
timeout /t 3 /nobreak >nul

echo Membuka SIMRS RSUD ISTEK 'Aisyiyah Kendari di peramban...
start http://localhost:5173

echo.
echo ======================================================================
echo  Sistem berhasil dijalankan!
echo  - Antarmuka SIMRS : http://localhost:5173
echo  - Server API FHIR : http://localhost:8000
echo  - Dokumentasi API : http://localhost:8000/docs
echo.
echo  Biarkan jendela terminal tetap terbuka selama sistem digunakan.
echo ======================================================================
echo.
pause
