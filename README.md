# SIMRS RSUD ISTEK 'Aisyiyah Kendari — E-Health (HL7 FHIR R4) | Kelompok 3

Aplikasi Sistem Informasi Manajemen Rumah Sakit (SIMRS) & Rekam Medis Elektronik (RME) terintegrasi untuk **RSUD ISTEK 'Aisyiyah Kendari** pada mata kuliah / praktikum **E-Health**, berbasis standar interoperabilitas **HL7 FHIR (Fast Healthcare Interoperability Resources) Release 4 (v4.3.0)**.

Sistem ini menggabungkan, memvalidasi, dan mentransformasikan:
1. **Subsistem Kelompok 1**: Data Identitas Pasien + Diagnosa Klinis berbasis terminologi standar **SNOMED CT**.
2. **Subsistem Kelompok 2**: Metadata Pemeriksaan Citra Radiologi **DICOM** (Modalitas `DX`/`CR`/`CT`/`MR`, tanggal pemeriksaan, dan berkas citra).
3. **Subsistem Kelompok 3 (SIMRS RSUD ISTEK 'Aisyiyah Kendari)**: Lembar kerja rekam medis terpadu (`RM-01`, `RM-02`, `RM-03`) serta log payload interoperabilitas JSON FHIR R4 (`Patient` & `DiagnosticReport`).

---

## Struktur Direktori Proyek

```text
Web Dashboard Integrasi (FHIR Simplified)/
├── README.md                        # Panduan ringkas proyek
├── DOKUMENTASI_SISTEM.md            # Dokumentasi teknis arsitektur & API
├── run_all.bat                      # Menjalankan Backend + Frontend + Browser otomatis
├── run_backend.bat                  # Menjalankan server Backend FastAPI (Port 8000)
├── run_frontend.bat                 # Menjalankan server Frontend Vite (Port 5173)
├── backend/
│   ├── .venv/                       # Virtual environment Python 3.12
│   ├── main.py                      # Server FastAPI & mesin pemetaan FHIR R4B
│   ├── requirements.txt             # Dependensi Python (FastAPI, fhir.resources, uvicorn, pydantic)
│   ├── static/
│   │   └── sample_chest_xray.jpg    # Sampel citra rontgen toraks
│   └── data/                        # Contoh berkas input JSON
│       ├── kelompok1_sample.json
│       ├── kelompok2_sample.json
│       └── combined_sample.json
└── frontend/
    ├── package.json                 # Dependensi Node (React 19, Vite, Axios, Lucide)
    ├── vite.config.js               # Konfigurasi proxy (/api & /static -> localhost:8000)
    ├── index.html
    └── src/
        ├── main.jsx                 # Entrypoint React
        ├── App.jsx                  # Komponen utama Lembar Kerja SIMRS
        ├── App.css                  # Styling tabel & formulir SIMRS RSUD ISTEK 'Aisyiyah Kendari
        ├── index.css                # Reset CSS dasar
        └── components/
            ├── PatientCard.jsx      # Modul RM-01: Data Identitas Pasien (FHIR Patient)
            ├── DiagnosisCard.jsx    # Modul RM-02: Diagnosa & Koding Klinis (SNOMED CT & ICD-10)
            ├── RadiologyCard.jsx    # Modul RM-03: Pemeriksaan Radiologi PACS (DICOM)
            ├── FhirJsonViewer.jsx   # Modul FHIR-R4: Log Payload JSON Interoperabilitas
            └── InputDataModal.jsx   # Formulir Entri & Simulasi Integrasi Data
```

---

## Panduan Menjalankan Aplikasi

### Cara Cepat (Windows):
Klik ganda berkas **`run_all.bat`** pada direktori utama proyek. Skrip akan otomatis mengaktifkan lingkungan virtual `backend\.venv`, menjalankan backend di port `8000`, frontend di port `5173`, dan membuka peramban ke `http://localhost:5173`.

### Cara Manual melalui Terminal:
1. **Backend (FastAPI)**:
   ```powershell
   cd backend
   .\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
2. **Frontend (React Vite)**:
   ```powershell
   cd frontend
   npm run dev
   ```
