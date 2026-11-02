from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from urllib.parse import quote
import os
import re
import shutil

# Import library resmi fhir.resources Release 4 (R4B v4.3.0)
try:
    from fhir.resources.R4B.patient import Patient
    from fhir.resources.R4B.diagnosticreport import DiagnosticReport
    FHIR_RELEASE_VERSION = "R4 (v4.3.0)"
except ImportError:
    from fhir.resources.patient import Patient
    from fhir.resources.diagnosticreport import DiagnosticReport
    FHIR_RELEASE_VERSION = "R4/R5"

app = FastAPI(
    title="SIMRS RSUD ISTEK 'Aisyiyah Kendari — E-Health (HL7 FHIR R4)",
    description="Backend API Integrasi Rekam Medis Elektronik (RME) RSUD ISTEK 'Aisyiyah Kendari untuk transformasi data pasien (SNOMED CT) & radiologi (DICOM) ke standar HL7 FHIR R4",
    version="2.1.0"
)

# ---------------------------------------------------------------------------
# Konfigurasi CORS (Cross-Origin Resource Sharing)
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(__file__)
STATIC_DIR = os.path.join(BASE_DIR, "static")
ARCHIVE_DIR = os.path.join(BASE_DIR, "archive")

os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

if os.path.isdir(ARCHIVE_DIR):
    app.mount("/archive", StaticFiles(directory=ARCHIVE_DIR), name="archive")

# Kamus Standar Modalitas DICOM
DICOM_MODALITY_MAP: Dict[str, str] = {
    "DX": "Digital Radiography (Rontgen Digital)",
    "CR": "Computed Radiography (Rontgen Konvensional)",
    "CT": "Computed Tomography (CT Scan)",
    "MR": "Magnetic Resonance Imaging (MRI)",
    "US": "Ultrasound (Ultrasonografi / USG)",
    "MG": "Mammography (Mamografi)",
    "XA": "X-Ray Angiography (Angiografi)",
    "NM": "Nuclear Medicine (Kedokteran Nuklir)",
    "PT": "Positron Emission Tomography (PET Scan)",
}


def resolve_archive_image(image_file_name: str) -> str:
    """
    Mencari berkas citra pada folder backend/static terlebih dahulu.
    Apabila belum ada di static namun tersedia di dalam backend/archive/chest_xray,
    berkas akan disalin otomatis ke backend/static agar selalu dapat diakses via /static/{filename}.
    """
    clean_name = os.path.basename((image_file_name or "sample_chest_xray.jpg").strip()) or "sample_chest_xray.jpg"
    static_target = os.path.join(STATIC_DIR, clean_name)

    if os.path.isfile(static_target):
        return clean_name

    # Cari di dalam subdirektori backend/archive/chest_xray/{val,test,train}/{PNEUMONIA,NORMAL}
    chest_xray_root = os.path.join(ARCHIVE_DIR, "chest_xray")
    if os.path.isdir(chest_xray_root):
        for split in ["val", "test", "train"]:
            for label in ["PNEUMONIA", "NORMAL"]:
                candidate = os.path.join(chest_xray_root, split, label, clean_name)
                if os.path.isfile(candidate):
                    try:
                        shutil.copy2(candidate, static_target)
                    except OSError:
                        pass
                    return clean_name

    return clean_name


# ---------------------------------------------------------------------------
# Skema Pydantic untuk Request Body dari Kelompok Lain
# ---------------------------------------------------------------------------

class PatientInput(BaseModel):
    """
    Format data input dari Kelompok 1 (Form Pasien + Diagnosis SNOMED CT)
    """
    patientId: str = Field(..., json_schema_extra={"example": "P-001"}, description="ID Unik Pasien / No. RM")
    nama: str = Field(..., json_schema_extra={"example": "Budi Santoso"}, description="Nama Lengkap Pasien")
    gender: str = Field(..., json_schema_extra={"example": "male"}, description="Jenis Kelamin (male/female/other/unknown)")
    diagnosisText: str = Field(..., json_schema_extra={"example": "Pneumonia"}, description="Teks Diagnosis Klinis")
    snomedCode: str = Field(..., json_schema_extra={"example": "233604007"}, description="Kode SNOMED CT untuk Diagnosis")


class RadiologyInput(BaseModel):
    """
    Format data input dari Kelompok 2 (Metadata File DICOM)
    """
    patientId: str = Field(..., json_schema_extra={"example": "P-001"}, description="ID Pasien terkait foto rontgen")
    modality: str = Field(..., json_schema_extra={"example": "DX"}, description="Modalitas radiologi (DX = Digital Radiography, CT, MR, dll)")
    studyDate: str = Field(..., json_schema_extra={"example": "2026-10-24"}, description="Tanggal pemeriksaan (YYYY-MM-DD)")
    imageFileName: str = Field(..., json_schema_extra={"example": "person1946_bacteria_4874.jpeg"}, description="Nama file citra dari archive/chest_xray atau static")
    diagnosisText: Optional[str] = Field(None, json_schema_extra={"example": "Pneumonia"}, description="Diagnosis terkait (opsional)")
    snomedCode: Optional[str] = Field(None, json_schema_extra={"example": "233604007"}, description="Kode SNOMED CT (opsional)")


class CombinedInput(BaseModel):
    """
    Format input gabungan untuk kemudahan integrasi di Dashboard.
    """
    patientId: str = Field("P-001", json_schema_extra={"example": "P-001"})
    nama: str = Field("Budi Santoso", json_schema_extra={"example": "Budi Santoso"})
    gender: str = Field("male", json_schema_extra={"example": "male"})
    diagnosisText: str = Field("Pneumonia", json_schema_extra={"example": "Pneumonia"})
    snomedCode: str = Field("233604007", json_schema_extra={"example": "233604007"})
    modality: str = Field("DX", json_schema_extra={"example": "DX"})
    studyDate: str = Field("2026-10-24", json_schema_extra={"example": "2026-10-24"})
    imageFileName: str = Field("person1946_bacteria_4874.jpeg", json_schema_extra={"example": "person1946_bacteria_4874.jpeg"})


# ---------------------------------------------------------------------------
# Helper Functions: Normalisasi & Transformasi Data Mentah ke Resource FHIR R4
# ---------------------------------------------------------------------------

def sanitize_fhir_id(raw_id: str) -> str:
    """
    Memastikan ID memenuhi spesifikasi regex HL7 FHIR R4: ^[A-Za-z0-9\\-\\.]{1,64}$
    """
    cleaned = re.sub(r"[^A-Za-z0-9\-\.]", "-", (raw_id or "").strip())
    cleaned = re.sub(r"-+", "-", cleaned).strip("-")
    return (cleaned[:64] if cleaned else "P-UNKNOWN")


def normalize_gender(gender: str) -> str:
    """
    Normalisasi nilai gender ke kode administratif FHIR R4 (male | female | other | unknown)
    """
    g = (gender or "").lower().strip()
    if g in ["male", "m", "laki-laki", "laki", "pria", "l"]:
        return "male"
    if g in ["female", "f", "perempuan", "wanita", "p"]:
        return "female"
    if g in ["other", "lainnya"]:
        return "other"
    return "unknown"


def normalize_study_date(study_date: str) -> str:
    """
    Memastikan format tanggal sesuai standar ISO 8601 (YYYY-MM-DD).
    """
    cleaned = (study_date or "").strip()
    if re.match(r"^\d{4}-\d{2}-\d{2}", cleaned):
        return cleaned
    return "2026-10-24"


def create_fhir_patient(patient_id: str, nama: str, gender: str) -> Patient:
    fhir_id = sanitize_fhir_id(patient_id)
    gender_normalized = normalize_gender(gender)
    clean_name = (nama or "Pasien Tanpa Nama").strip()

    patient_resource = Patient(
        id=fhir_id,
        identifier=[
            {
                "use": "usual",
                "system": "http://ehealth.kelompok3.local/mrn",
                "value": (patient_id or fhir_id).strip()
            }
        ],
        name=[
            {
                "use": "official",
                "text": clean_name
            }
        ],
        gender=gender_normalized,
        active=True
    )
    return patient_resource


def create_fhir_diagnostic_report(
    patient_id: str,
    patient_name: str,
    modality: str,
    study_date: str,
    image_file_name: str,
    diagnosis_text: str,
    snomed_code: str
) -> DiagnosticReport:
    fhir_patient_id = sanitize_fhir_id(patient_id)
    report_id = sanitize_fhir_id(f"DR-{fhir_patient_id}")
    modality_code = (modality or "DX").upper().strip()
    modality_display = DICOM_MODALITY_MAP.get(modality_code, f"Radiology / Modality {modality_code}")

    resolved_file_name = resolve_archive_image(image_file_name)
    encoded_file_name = quote(resolved_file_name)

    clean_diagnosis = (diagnosis_text or "Pemeriksaan Radiologi").strip()
    clean_snomed = (snomed_code or "363680008").strip()
    clean_date = normalize_study_date(study_date)

    diagnostic_report = DiagnosticReport(
        id=report_id,
        status="final",
        category=[
            {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/v2-0074",
                        "code": modality_code,
                        "display": modality_display
                    }
                ],
                "text": f"Radiology Report ({modality_code})"
            }
        ],
        code={
            "coding": [
                {
                    "system": "http://snomed.info/sct",
                    "code": clean_snomed,
                    "display": clean_diagnosis
                }
            ],
            "text": clean_diagnosis
        },
        subject={
            "reference": f"Patient/{fhir_patient_id}",
            "display": (patient_name or f"Patient {fhir_patient_id}").strip()
        },
        effectiveDateTime=clean_date,
        presentedForm=[
            {
                "contentType": "image/jpeg",
                "title": resolved_file_name,
                "url": f"/static/{encoded_file_name}"
            }
        ]
    )
    return diagnostic_report


# ---------------------------------------------------------------------------
# Daftar Kasus Pasien Terintegrasi dengan Dataset backend/archive/chest_xray
# ---------------------------------------------------------------------------

INITIAL_CASES: List[Dict[str, str]] = [
    {
        "patientId": "P-001",
        "nama": "Budi Santoso",
        "gender": "male",
        "diagnosisText": "Pneumonia (Bacterial Infiltrate)",
        "snomedCode": "233604007",
        "modality": "DX",
        "studyDate": "2026-10-24",
        "imageFileName": "person1946_bacteria_4874.jpeg",
        "archivePath": "archive/chest_xray/val/PNEUMONIA/person1946_bacteria_4874.jpeg",
    },
    {
        "patientId": "P-002",
        "nama": "Siti Rahma",
        "gender": "female",
        "diagnosisText": "Viral Pneumonia",
        "snomedCode": "75570004",
        "modality": "CR",
        "studyDate": "2026-10-26",
        "imageFileName": "person10_virus_35.jpeg",
        "archivePath": "archive/chest_xray/test/PNEUMONIA/person10_virus_35.jpeg",
    },
    {
        "patientId": "P-003",
        "nama": "Ahmad Zaki",
        "gender": "male",
        "diagnosisText": "Lobar Bacterial Pneumonia",
        "snomedCode": "278516003",
        "modality": "DX",
        "studyDate": "2026-10-28",
        "imageFileName": "person1954_bacteria_4886.jpeg",
        "archivePath": "archive/chest_xray/val/PNEUMONIA/person1954_bacteria_4886.jpeg",
    },
    {
        "patientId": "P-004",
        "nama": "Hendra Wijaya",
        "gender": "male",
        "diagnosisText": "Normal Chest Radiograph (Toraks Normal)",
        "snomedCode": "168731009",
        "modality": "DX",
        "studyDate": "2026-10-30",
        "imageFileName": "NORMAL2-IM-1427-0001.jpeg",
        "archivePath": "archive/chest_xray/val/NORMAL/NORMAL2-IM-1427-0001.jpeg",
    },
    {
        "patientId": "P-005",
        "nama": "Dewi Lestari",
        "gender": "female",
        "diagnosisText": "Pulmonary Tuberculosis",
        "snomedCode": "154283005",
        "modality": "CR",
        "studyDate": "2026-11-01",
        "imageFileName": "person1949_bacteria_4880.jpeg",
        "archivePath": "archive/chest_xray/val/PNEUMONIA/person1949_bacteria_4880.jpeg",
    },
]

ARCHIVE_CATALOG: List[Dict[str, str]] = [
    {
        "fileName": "person1946_bacteria_4874.jpeg",
        "category": "PNEUMONIA (Bakterial)",
        "sourcePath": "archive/chest_xray/val/PNEUMONIA/person1946_bacteria_4874.jpeg",
        "recommendedDiagnosis": "Pneumonia (Bacterial Infiltrate)",
        "recommendedSnomed": "233604007",
    },
    {
        "fileName": "person1949_bacteria_4880.jpeg",
        "category": "PNEUMONIA (Bakterial)",
        "sourcePath": "archive/chest_xray/val/PNEUMONIA/person1949_bacteria_4880.jpeg",
        "recommendedDiagnosis": "Bacterial Pneumonia",
        "recommendedSnomed": "53084003",
    },
    {
        "fileName": "person1954_bacteria_4886.jpeg",
        "category": "PNEUMONIA (Lobar Bakterial)",
        "sourcePath": "archive/chest_xray/val/PNEUMONIA/person1954_bacteria_4886.jpeg",
        "recommendedDiagnosis": "Lobar Bacterial Pneumonia",
        "recommendedSnomed": "278516003",
    },
    {
        "fileName": "person10_virus_35.jpeg",
        "category": "PNEUMONIA (Viral)",
        "sourcePath": "archive/chest_xray/test/PNEUMONIA/person10_virus_35.jpeg",
        "recommendedDiagnosis": "Viral Pneumonia",
        "recommendedSnomed": "75570004",
    },
    {
        "fileName": "person15_virus_46.jpeg",
        "category": "PNEUMONIA (Viral Interstisial)",
        "sourcePath": "archive/chest_xray/test/PNEUMONIA/person15_virus_46.jpeg",
        "recommendedDiagnosis": "Viral Pneumonia",
        "recommendedSnomed": "75570004",
    },
    {
        "fileName": "NORMAL2-IM-1427-0001.jpeg",
        "category": "NORMAL (Toraks Normal)",
        "sourcePath": "archive/chest_xray/val/NORMAL/NORMAL2-IM-1427-0001.jpeg",
        "recommendedDiagnosis": "Normal Chest Radiograph (Toraks Normal)",
        "recommendedSnomed": "168731009",
    },
    {
        "fileName": "NORMAL2-IM-1430-0001.jpeg",
        "category": "NORMAL (Toraks Normal)",
        "sourcePath": "archive/chest_xray/val/NORMAL/NORMAL2-IM-1430-0001.jpeg",
        "recommendedDiagnosis": "Normal Chest Radiograph (Toraks Normal)",
        "recommendedSnomed": "168731009",
    },
    {
        "fileName": "NORMAL2-IM-1436-0001.jpeg",
        "category": "NORMAL (Toraks Normal)",
        "sourcePath": "archive/chest_xray/val/NORMAL/NORMAL2-IM-1436-0001.jpeg",
        "recommendedDiagnosis": "Normal Chest Radiograph (Toraks Normal)",
        "recommendedSnomed": "168731009",
    },
    {
        "fileName": "sample_chest_xray.jpg",
        "category": "SAMPEL DEFAULT",
        "sourcePath": "static/sample_chest_xray.jpg",
        "recommendedDiagnosis": "Pneumonia",
        "recommendedSnomed": "233604007",
    },
]

PATIENT_STORE: Dict[str, Dict[str, Any]] = {}


def build_combined_record(raw: Dict[str, str]) -> Dict[str, Any]:
    patient_fhir = create_fhir_patient(
        patient_id=raw["patientId"],
        nama=raw["nama"],
        gender=raw["gender"]
    )
    report_fhir = create_fhir_diagnostic_report(
        patient_id=raw["patientId"],
        patient_name=raw["nama"],
        modality=raw["modality"],
        study_date=raw["studyDate"],
        image_file_name=raw["imageFileName"],
        diagnosis_text=raw["diagnosisText"],
        snomed_code=raw["snomedCode"]
    )
    return {
        "raw": raw,
        "patient": patient_fhir.model_dump(mode="json"),
        "diagnosticReport": report_fhir.model_dump(mode="json")
    }


def seed_initial_store() -> None:
    PATIENT_STORE.clear()
    for case in INITIAL_CASES:
        fid = sanitize_fhir_id(case["patientId"])
        PATIENT_STORE[fid] = build_combined_record(case)


seed_initial_store()


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@app.get("/", summary="Health Check")
def health_check():
    return {
        "status": "ok",
        "institution": "RSUD ISTEK 'Aisyiyah Kendari",
        "service": "Sistem Integrasi E-Health (HL7 FHIR R4) - Kelompok 3",
        "fhirVersion": FHIR_RELEASE_VERSION,
        "activePatients": len(PATIENT_STORE)
    }


@app.get("/api/fhir/archive-samples", summary="Katalog Citra Rontgen dari Direktori backend/archive/chest_xray")
def list_archive_samples():
    """
    Mengembalikan daftar citra rontgen toraks dari dataset backend/archive/chest_xray
    beserta kategori (PNEUMONIA / NORMAL) dan rekomendasi kode SNOMED CT.
    """
    return {
        "status": "success",
        "datasetRoot": "backend/archive/chest_xray",
        "count": len(ARCHIVE_CATALOG),
        "samples": ARCHIVE_CATALOG
    }


@app.get("/api/fhir/patients", summary="Daftar Seluruh Pasien Terintegrasi di SIMRS")
def list_integrated_patients():
    records = list(PATIENT_STORE.values())
    return {
        "status": "success",
        "count": len(records),
        "records": records
    }


@app.post("/api/fhir/patient", summary="Menerima data Kelompok 1 & konversi ke FHIR Patient")
def convert_patient(data: PatientInput):
    try:
        fid = sanitize_fhir_id(data.patientId)
        existing_raw = PATIENT_STORE.get(fid, {}).get("raw", {})

        merged_raw = {
            "patientId": data.patientId,
            "nama": data.nama,
            "gender": data.gender,
            "diagnosisText": data.diagnosisText,
            "snomedCode": data.snomedCode,
            "modality": existing_raw.get("modality", "DX"),
            "studyDate": existing_raw.get("studyDate", "2026-10-24"),
            "imageFileName": existing_raw.get("imageFileName", "person1946_bacteria_4874.jpeg"),
        }
        record = build_combined_record(merged_raw)
        PATIENT_STORE[fid] = record

        return {
            "status": "success",
            "message": "Data berhasil dikonversi ke FHIR Patient Resource",
            "patient": record["patient"],
            "diagnosticReport": record["diagnosticReport"],
            "diagnosis": {
                "diagnosisText": data.diagnosisText,
                "snomedCode": data.snomedCode,
                "system": "http://snomed.info/sct"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal membuat FHIR Patient: {str(e)}")


@app.post("/api/fhir/diagnostic-report", summary="Menerima data Kelompok 2 & konversi ke FHIR DiagnosticReport")
def convert_diagnostic_report(data: RadiologyInput):
    try:
        fid = sanitize_fhir_id(data.patientId)
        existing_raw = PATIENT_STORE.get(fid, {}).get("raw", {})

        merged_raw = {
            "patientId": data.patientId,
            "nama": existing_raw.get("nama", f"Pasien {data.patientId}"),
            "gender": existing_raw.get("gender", "unknown"),
            "diagnosisText": data.diagnosisText or existing_raw.get("diagnosisText", "Pemeriksaan Radiologi Toraks"),
            "snomedCode": data.snomedCode or existing_raw.get("snomedCode", "363680008"),
            "modality": data.modality,
            "studyDate": data.studyDate,
            "imageFileName": data.imageFileName,
        }
        record = build_combined_record(merged_raw)
        PATIENT_STORE[fid] = record

        return {
            "status": "success",
            "message": "Data berhasil dikonversi ke FHIR DiagnosticReport Resource",
            "patient": record["patient"],
            "diagnosticReport": record["diagnosticReport"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal membuat FHIR DiagnosticReport: {str(e)}")


@app.post("/api/fhir/combined", summary="Endpoint Utama Integrasi Kelompok 1 + Kelompok 2")
def convert_combined(data: CombinedInput):
    try:
        fid = sanitize_fhir_id(data.patientId)
        raw = {
            "patientId": data.patientId,
            "nama": data.nama,
            "gender": data.gender,
            "diagnosisText": data.diagnosisText,
            "snomedCode": data.snomedCode,
            "modality": data.modality,
            "studyDate": data.studyDate,
            "imageFileName": data.imageFileName,
        }
        record = build_combined_record(raw)
        PATIENT_STORE[fid] = record

        return {
            "patient": record["patient"],
            "diagnosticReport": record["diagnosticReport"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal memproses data gabungan FHIR: {str(e)}")


@app.get("/api/fhir/sample", summary="Mendapatkan Sample Data Gabungan FHIR Realistis")
def get_sample_combined():
    default_case = INITIAL_CASES[0]
    record = build_combined_record(default_case)
    PATIENT_STORE[sanitize_fhir_id(default_case["patientId"])] = record

    return {
        "patient": record["patient"],
        "diagnosticReport": record["diagnosticReport"]
    }
