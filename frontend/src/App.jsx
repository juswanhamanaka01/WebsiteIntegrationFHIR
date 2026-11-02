import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  RefreshCw,
  Plus,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

import PatientCard from './components/PatientCard';
import DiagnosisCard from './components/DiagnosisCard';
import RadiologyCard from './components/RadiologyCard';
import FhirJsonViewer from './components/FhirJsonViewer';
import InputDataModal from './components/InputDataModal';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const DEFAULT_QUEUE = [
  {
    patientId: 'P-001',
    nama: 'Budi Santoso',
    gender: 'male',
    diagnosisText: 'Pneumonia (Bacterial Infiltrate)',
    snomedCode: '233604007',
    modality: 'DX',
    studyDate: '2026-10-24',
    imageFileName: 'person1946_bacteria_4874.jpeg',
  },
  {
    patientId: 'P-002',
    nama: 'Siti Rahma',
    gender: 'female',
    diagnosisText: 'Viral Pneumonia',
    snomedCode: '75570004',
    modality: 'CR',
    studyDate: '2026-10-26',
    imageFileName: 'person10_virus_35.jpeg',
  },
  {
    patientId: 'P-003',
    nama: 'Ahmad Zaki',
    gender: 'male',
    diagnosisText: 'Lobar Bacterial Pneumonia',
    snomedCode: '278516003',
    modality: 'DX',
    studyDate: '2026-10-28',
    imageFileName: 'person1954_bacteria_4886.jpeg',
  },
  {
    patientId: 'P-004',
    nama: 'Hendra Wijaya',
    gender: 'male',
    diagnosisText: 'Normal Chest Radiograph (Toraks Normal)',
    snomedCode: '168731009',
    modality: 'DX',
    studyDate: '2026-10-30',
    imageFileName: 'NORMAL2-IM-1427-0001.jpeg',
  },
  {
    patientId: 'P-005',
    nama: 'Dewi Lestari',
    gender: 'female',
    diagnosisText: 'Pulmonary Tuberculosis',
    snomedCode: '154283005',
    modality: 'CR',
    studyDate: '2026-11-01',
    imageFileName: 'person1949_bacteria_4880.jpeg',
  },
];

function formatSyncTime() {
  return Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(Date.now());
}

async function requestWithFallback(method, path, payload) {
  try {
    if (method === 'GET') {
      return await axios.get(`${API_BASE_URL}${path}`);
    }
    return await axios.post(`${API_BASE_URL}${path}`, payload);
  } catch {
    const directUrl = `http://localhost:8000${path}`;
    if (method === 'GET') {
      return await axios.get(directUrl);
    }
    return await axios.post(directUrl, payload);
  }
}

export default function App() {
  const [patient, setPatient] = useState(null);
  const [diagnosticReport, setDiagnosticReport] = useState(null);
  const [patientQueue, setPatientQueue] = useState(DEFAULT_QUEUE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const syncQueueFromBackend = useCallback(async () => {
    try {
      const listRes = await requestWithFallback('GET', '/api/fhir/patients');
      if (listRes.data?.records?.length) {
        setPatientQueue(listRes.data.records.map((r) => r.raw));
      }
    } catch {
      // Gunakan antrean lokal jika endpoint daftar pasien belum tersedia
    }
  }, []);

  const handleResetToSample = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestWithFallback('GET', '/api/fhir/sample');
      if (response.data) {
        setPatient(response.data.patient);
        setDiagnosticReport(response.data.diagnosticReport);
        setLastUpdated(formatSyncTime());
      }
      await syncQueueFromBackend();
    } catch (err) {
      console.error('Error fetching sample FHIR data:', err);
      setError(
        'Koneksi ke server backend FastAPI (http://localhost:8000) gagal. Pastikan layanan backend sudah dijalankan.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const response = await requestWithFallback('GET', '/api/fhir/sample');
        if (isMounted && response.data) {
          setPatient(response.data.patient);
          setDiagnosticReport(response.data.diagnosticReport);
          setLastUpdated(formatSyncTime());
          setError(null);
        }
        await syncQueueFromBackend();
      } catch (err) {
        console.error('Error initializing FHIR data:', err);
        if (isMounted) {
          setError(
            'Koneksi ke server backend FastAPI (http://localhost:8000) gagal. Pastikan layanan backend sudah dijalankan.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [syncQueueFromBackend]);

  const handleCombinedSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await requestWithFallback('POST', '/api/fhir/combined', formData);

      if (response.data) {
        setPatient(response.data.patient);
        setDiagnosticReport(response.data.diagnosticReport);
        setLastUpdated(formatSyncTime());
        setIsModalOpen(false);

        setPatientQueue((prev) => {
          const exists = prev.some((item) => item.patientId === formData.patientId);
          if (exists) {
            return prev.map((item) =>
              item.patientId === formData.patientId ? formData : item
            );
          }
          return [...prev, formData];
        });
      }
    } catch (err) {
      console.error('Error submitting combined data:', err);
      alert('Gagal memproses data FHIR: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePatientId = patient?.identifier?.[0]?.value || patient?.id || 'P-001';
  const activePatientName = patient?.name?.[0]?.text || 'Budi Santoso';
  const activeGender = patient?.gender === 'female' ? 'Perempuan (P)' : patient?.gender === 'male' ? 'Laki-laki (L)' : 'Tidak Diketahui';
  const activeDiagnosis =
    diagnosticReport?.code?.coding?.[0]?.display ||
    diagnosticReport?.code?.text ||
    'Pneumonia';
  const activeSnomed = diagnosticReport?.code?.coding?.[0]?.code || '233604007';
  const activeModality = diagnosticReport?.category?.[0]?.coding?.[0]?.code || 'DX';
  const activeStudyDate = diagnosticReport?.effectiveDateTime || '2026-10-24';

  return (
    <div className="simrs-layout">
      {/* Bar Informasi Sistem Atas */}
      <div className="simrs-utility-bar">
        <div className="utility-left">
          <span className="utility-inst">RSUD ISTEK &apos;AISYIYAH KENDARI</span>
          <span className="utility-sep">/</span>
          <span>INSTALASI REKAM MEDIS ELEKTRONIK &amp; RADIOLOGI</span>
          <span className="utility-sep">/</span>
          <span>MODUL INTEGRASI E-HEALTH (HL7 FHIR R4)</span>
        </div>
        <div className="utility-right">
          {lastUpdated && (
            <span className="utility-meta">
              Sinkronisasi Terakhir: <strong>{lastUpdated} WITA</strong>
            </span>
          )}
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="utility-link"
          >
            Dokumentasi API (Swagger) <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {/* Header Utama Rumah Sakit */}
      <header className="simrs-header">
        <div className="header-brand">
          <div className="rs-emblem" aria-hidden="true">
            <span className="emblem-cross">+</span>
            <span className="emblem-sub">RSIA</span>
          </div>
          <div className="header-titles">
            <div className="header-title-line">
              <h1>RSUD ISTEK &apos;Aisyiyah Kendari</h1>
              <span className="unit-tag">E-HEALTH • KELOMPOK 3</span>
            </div>
            <p className="header-subtitle">
              Sistem Informasi Manajemen Rumah Sakit — Integrasi Rekam Medis Pasien (SNOMED CT) &amp; Citra Radiologi (DICOM) berbasis HL7 FHIR R4
            </p>
          </div>
        </div>

        <div className="header-controls">
          <div className="server-badge" title="Status Koneksi Backend FastAPI Port 8000">
            <span className={`server-indicator ${error ? 'is-offline' : 'is-online'}`} />
            <span>Server FHIR: {error ? 'TERPUTUS' : 'AKTIF (PORT 8000)'}</span>
          </div>

          <button
            type="button"
            className="btn-simrs btn-simrs-outline"
            onClick={handleResetToSample}
            disabled={loading || isSubmitting}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Muat Ulang Default (P-001)</span>
          </button>

          <button
            type="button"
            className="btn-simrs btn-simrs-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={15} />
            <span>Input / Simulasi Data Integrasi</span>
          </button>
        </div>
      </header>

      {/* Sub-Bar Daftar Pasien Terintegrasi */}
      <div className="simrs-queue-strip">
        <div className="queue-strip-inner">
          <span className="queue-strip-title">Daftar Berkas Pasien:</span>
          <div className="queue-tabs">
            {patientQueue.map((item) => {
              const isCurrent = item.patientId === activePatientId;
              return (
                <button
                  key={item.patientId}
                  type="button"
                  className={`queue-tab ${isCurrent ? 'active' : ''}`}
                  onClick={() => handleCombinedSubmit(item)}
                  disabled={isSubmitting}
                >
                  <span className="q-code">{item.patientId}</span>
                  <span className="q-name">{item.nama}</span>
                  <span className="q-modality">{item.modality}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Konten Utama Lembar Kerja Rekam Medis */}
      <main className="simrs-workspace">
        {/* Tabel Ringkasan Identitas & Kunjungan Pasien (Header Rekam Medis) */}
        {!loading && !error && patient && diagnosticReport && (
          <section className="patient-summary-sheet" aria-label="Ringkasan Berkas Pasien">
            <div className="sheet-cell sheet-cell-rm">
              <span className="sheet-label">NO. REKAM MEDIS</span>
              <span className="sheet-value-mono">{activePatientId}</span>
            </div>
            <div className="sheet-cell sheet-cell-name">
              <span className="sheet-label">NAMA LENGKAP PASIEN</span>
              <span className="sheet-value-strong">{activePatientName}</span>
            </div>
            <div className="sheet-cell">
              <span className="sheet-label">JENIS KELAMIN</span>
              <span className="sheet-value">{activeGender}</span>
            </div>
            <div className="sheet-cell">
              <span className="sheet-label">DIAGNOSA KERJA (KELOMPOK 1)</span>
              <span className="sheet-value-clinical">
                {activeDiagnosis} <small>({activeSnomed})</small>
              </span>
            </div>
            <div className="sheet-cell">
              <span className="sheet-label">PEMERIKSAAN RADIOLOGI (KELOMPOK 2)</span>
              <span className="sheet-value">
                Modalitas {activeModality} • {activeStudyDate}
              </span>
            </div>
            <div className="sheet-cell sheet-cell-status">
              <span className="sheet-label">STATUS INTEROPERABILITAS</span>
              <span className="sheet-status-ok">TERVALIDASI FHIR R4</span>
            </div>
          </section>
        )}

        {/* Kondisi Memuat */}
        {loading && (
          <div className="simrs-state-box">
            <div className="simrs-loader" />
            <h3>Mengambil Berkas Rekam Medis Elektronik...</h3>
            <p>Menghubungi endpoint <code>GET /api/fhir/sample</code> pada server lokal.</p>
          </div>
        )}

        {/* Kondisi Gangguan Koneksi */}
        {!loading && error && (
          <div className="simrs-state-box simrs-state-error">
            <AlertTriangle size={36} className="error-icon" />
            <h3>Layanan Backend FastAPI Tidak Terjangkau</h3>
            <p>{error}</p>
            <div className="error-guide">
              <strong>Petunjuk Menjalankan Layanan Backend:</strong>
              <ol>
                <li>Jalankan file <code>run_all.bat</code> atau <code>run_backend.bat</code> pada direktori proyek.</li>
                <li>Atau melalui terminal: <code>backend\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000</code></li>
              </ol>
            </div>
            <button type="button" className="btn-simrs btn-simrs-primary" onClick={handleResetToSample}>
              <RefreshCw size={14} /> Coba Muat Ulang
            </button>
          </div>
        )}

        {/* 3 Modul Utama Rekam Medis & Penunjang */}
        {!loading && !error && (
          <>
            <div className="simrs-panels-grid">
              <PatientCard patient={patient} />
              <DiagnosisCard diagnosticReport={diagnosticReport} />
              <RadiologyCard diagnosticReport={diagnosticReport} />
            </div>

            <div className="simrs-fhir-section">
              <FhirJsonViewer
                patient={patient}
                diagnosticReport={diagnosticReport}
              />
            </div>
          </>
        )}
      </main>

      {/* Modal Entri & Simulasi Integrasi */}
      <InputDataModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCombinedSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Footer Resmi Rumah Sakit */}
      <footer className="simrs-footer">
        <div className="footer-left">
          <strong>RSUD ISTEK &apos;Aisyiyah Kendari</strong> — Sistem Informasi E-Health &amp; Rekam Medis Elektronik Terintegrasi (Kelompok 3)
        </div>
        <div className="footer-right">
          <span>Standar: HL7 FHIR R4 (v4.3.0)</span>
          <span>•</span>
          <span>Terminologi: SNOMED CT</span>
          <span>•</span>
          <span>Pencitraan: DICOM PS3.10</span>
        </div>
      </footer>
    </div>
  );
}
