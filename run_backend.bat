@echo off
title Backend SIMRS RSUD ISTEK 'Aisyiyah Kendari - Port 8000
color 0a

cd /d "%~dp0backend"
echo ======================================================================
echo    BACKEND SIMRS RSUD ISTEK 'AISYIYAH KENDARI (HL7 FHIR R4)
echo ======================================================================
echo Endpoint API : http://localhost:8000
echo Dokumentasi  : http://localhost:8000/docs
echo ======================================================================
echo.

if exist ".venv\Scripts\python.exe" (
    echo [INFO] Menggunakan Virtual Environment: backend\.venv
    ".venv\Scripts\python.exe" -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
) else if exist "venv\Scripts\python.exe" (
    echo [INFO] Menggunakan Virtual Environment: backend\venv
    "venv\Scripts\python.exe" -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
) else (
    echo [INFO] Menjalankan dengan sistem Python default...
    python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
)
pause
