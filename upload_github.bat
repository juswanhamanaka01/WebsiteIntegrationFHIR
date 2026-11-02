@echo off
title Upload Proyek ke GitHub - RSUD ISTEK 'Aisyiyah Kendari (E-Health)
color 0a

set "GIT_EXE=git"
if exist "C:\Program Files\Git\cmd\git.exe" (
    set "GIT_EXE=C:\Program Files\Git\cmd\git.exe"
)

cd /d "%~dp0"

echo ======================================================================
echo    UNGGAH PROYEK KE GITHUB - SIMRS RSUD ISTEK 'AISYIYAH KENDARI
echo ======================================================================
echo.
set "REPO_URL=https://github.com/juswanhamanaka01/WebsiteIntegrationFHIR.git"
set /p INPUT_URL="URL Repository GitHub [Tekan Enter untuk gunakan default %REPO_URL%]: "
if not "%INPUT_URL%"=="" set "REPO_URL=%INPUT_URL%"

echo.
echo [INFO] Menambahkan perubahan terbaru ke Git...
"%GIT_EXE%" add .
"%GIT_EXE%" commit -m "Update SIMRS RSUD ISTEK Aisyiyah Kendari - E-Health (HL7 FHIR R4)" 2>nul

echo [INFO] Mengatur remote origin ke: %REPO_URL%
"%GIT_EXE%" remote remove origin 2>nul
"%GIT_EXE%" remote add origin "%REPO_URL%"
"%GIT_EXE%" branch -M main

echo [INFO] Mengunggah (push) kode ke GitHub...
"%GIT_EXE%" push -u origin main

echo.
echo ======================================================================
echo  Proses selesai! Silakan periksa halaman repository GitHub Anda.
echo ======================================================================
pause

