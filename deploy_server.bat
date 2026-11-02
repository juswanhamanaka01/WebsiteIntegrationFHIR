@echo off
title Deploy ke Server Ubuntu via SSH & Docker - RSUD ISTEK 'Aisyiyah Kendari
color 0a

set "SSH_TARGET=istek@210.87.89.81"
set "SSH_PORT=22"
set "REMOTE_DIR=/home/istek/simrs-fhir"
set "APP_PORT=8085"

echo ======================================================================
echo    DEPLOY DOCKER KE SERVER UBUNTU (%SSH_TARGET%)
echo    SIMRS RSUD ISTEK 'AISYIYAH KENDARI - E-HEALTH (HL7 FHIR R4)
echo ======================================================================
echo.
set /p INPUT_PORT="Port SSH Server [Tekan Enter untuk default 22]: "
if not "%INPUT_PORT%"=="" set "SSH_PORT=%INPUT_PORT%"

cd /d "%~dp0"

echo.
echo [1/3] Membuat paket arsip aplikasi (deploy_bundle.tar.gz)...
tar -czf deploy_bundle.tar.gz Dockerfile docker-compose.yml .dockerignore backend/main.py backend/requirements.txt backend/static backend/data frontend/package.json frontend/package-lock.json frontend/vite.config.js frontend/index.html frontend/public frontend/src
if errorlevel 1 (
    echo [ERROR] Gagal membuat arsip deploy_bundle.tar.gz
    pause
    exit /b 1
)

echo.
echo [2/3] Mengirim dan mengekstrak aplikasi ke %SSH_TARGET% (Port %SSH_PORT%)...
echo       (Masukkan password SSH %SSH_TARGET% satu kali saat diminta)
type deploy_bundle.tar.gz | ssh -p %SSH_PORT% -o StrictHostKeyChecking=accept-new %SSH_TARGET% "mkdir -p %REMOTE_DIR% && cd %REMOTE_DIR% && tar -xzf - && (docker compose up -d --build || sudo docker compose up -d --build || docker-compose up -d --build || sudo docker-compose up -d --build)"
if errorlevel 1 (
    echo.
    echo [ERROR] Deployment via SSH gagal. Pastikan VPN/Jaringan ke 210.87.89.81 aktif dan port SSH benar.
    pause
    exit /b 1
)

del deploy_bundle.tar.gz 2>nul

echo.
echo ======================================================================
echo  DEPLOYMENT SELESAI!
echo  - Akses Aplikasi Web : http://210.87.89.81:%APP_PORT%
echo  - Dokumentasi API    : http://210.87.89.81:%APP_PORT%/docs
echo ======================================================================
pause
