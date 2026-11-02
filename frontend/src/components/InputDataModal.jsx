import React, { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';

const CLINICAL_PRESETS = [
  {
    name: 'P-001: Budi Santoso (Pneumonia Bakterial)',
    badge: 'DX • bacteria_4874',
    data: {
      patientId: 'P-001',
      nama: 'Budi Santoso',
      gender: 'male',
      diagnosisText: 'Pneumonia (Bacterial Infiltrate)',
      snomedCode: '233604007',
      modality: 'DX',
      studyDate: '2026-10-24',
      imageFileName: 'person1946_bacteria_4874.jpeg',
    },
  },
  {
    name: 'P-002: Siti Rahma (Pneumonia Viral)',
    badge: 'CR • virus_35',
    data: {
      patientId: 'P-002',
      nama: 'Siti Rahma',
      gender: 'female',
      diagnosisText: 'Viral Pneumonia',
      snomedCode: '75570004',
      modality: 'CR',
      studyDate: '2026-10-26',
      imageFileName: 'person10_virus_35.jpeg',
    },
  },
  {
    name: 'P-003: Ahmad Zaki (Pneumonia Lobaris)',
    badge: 'DX • bacteria_4886',
    data: {
      patientId: 'P-003',
      nama: 'Ahmad Zaki',
      gender: 'male',
      diagnosisText: 'Lobar Bacterial Pneumonia',
      snomedCode: '278516003',
      modality: 'DX',
      studyDate: '2026-10-28',
      imageFileName: 'person1954_bacteria_4886.jpeg',
    },
  },
  {
    name: 'P-004: Hendra Wijaya (Toraks Normal)',
    badge: 'DX • NORMAL-1427',
    data: {
      patientId: 'P-004',
      nama: 'Hendra Wijaya',
      gender: 'male',
      diagnosisText: 'Normal Chest Radiograph (Toraks Normal)',
      snomedCode: '168731009',
      modality: 'DX',
      studyDate: '2026-10-30',
      imageFileName: 'NORMAL2-IM-1427-0001.jpeg',
    },
  },
  {
    name: 'P-005: Dewi Lestari (TB Paru)',
    badge: 'CR • bacteria_4880',
    data: {
      patientId: 'P-005',
      nama: 'Dewi Lestari',
      gender: 'female',
      diagnosisText: 'Pulmonary Tuberculosis',
      snomedCode: '154283005',
      modality: 'CR',
      studyDate: '2026-11-01',
      imageFileName: 'person1949_bacteria_4880.jpeg',
    },
  },
];

const ARCHIVE_IMAGE_SAMPLES = [
  {
    fileName: 'person1946_bacteria_4874.jpeg',
    label: '[PNEUMONIA - Bakterial] person1946_bacteria_4874.jpeg (val/PNEUMONIA)',
    diagnosisText: 'Pneumonia (Bacterial Infiltrate)',
    snomedCode: '233604007',
  },
  {
    fileName: 'person1949_bacteria_4880.jpeg',
    label: '[PNEUMONIA - Bakterial] person1949_bacteria_4880.jpeg (val/PNEUMONIA)',
    diagnosisText: 'Bacterial Pneumonia',
    snomedCode: '53084003',
  },
  {
    fileName: 'person1954_bacteria_4886.jpeg',
    label: '[PNEUMONIA - Lobaris] person1954_bacteria_4886.jpeg (val/PNEUMONIA)',
    diagnosisText: 'Lobar Bacterial Pneumonia',
    snomedCode: '278516003',
  },
  {
    fileName: 'person10_virus_35.jpeg',
    label: '[PNEUMONIA - Viral] person10_virus_35.jpeg (test/PNEUMONIA)',
    diagnosisText: 'Viral Pneumonia',
    snomedCode: '75570004',
  },
  {
    fileName: 'person15_virus_46.jpeg',
    label: '[PNEUMONIA - Viral] person15_virus_46.jpeg (test/PNEUMONIA)',
    diagnosisText: 'Viral Pneumonia',
    snomedCode: '75570004',
  },
  {
    fileName: 'NORMAL2-IM-1427-0001.jpeg',
    label: '[NORMAL - Toraks Normal] NORMAL2-IM-1427-0001.jpeg (val/NORMAL)',
    diagnosisText: 'Normal Chest Radiograph (Toraks Normal)',
    snomedCode: '168731009',
  },
  {
    fileName: 'NORMAL2-IM-1430-0001.jpeg',
    label: '[NORMAL - Toraks Normal] NORMAL2-IM-1430-0001.jpeg (val/NORMAL)',
    diagnosisText: 'Normal Chest Radiograph (Toraks Normal)',
    snomedCode: '168731009',
  },
  {
    fileName: 'NORMAL2-IM-1436-0001.jpeg',
    label: '[NORMAL - Toraks Normal] NORMAL2-IM-1436-0001.jpeg (val/NORMAL)',
    diagnosisText: 'Normal Chest Radiograph (Toraks Normal)',
    snomedCode: '168731009',
  },
  {
    fileName: 'sample_chest_xray.jpg',
    label: '[SAMPEL BAWAAN] sample_chest_xray.jpg (static)',
    diagnosisText: 'Pneumonia',
    snomedCode: '233604007',
  },
];

const SNOMED_QUICK_OPTIONS = [
  { label: '233604007 — Pneumonia (Bacterial Infiltrate)', text: 'Pneumonia (Bacterial Infiltrate)', code: '233604007' },
  { label: '53084003 — Bacterial Pneumonia', text: 'Bacterial Pneumonia', code: '53084003' },
  { label: '75570004 — Viral Pneumonia', text: 'Viral Pneumonia', code: '75570004' },
  { label: '278516003 — Lobar Bacterial Pneumonia', text: 'Lobar Bacterial Pneumonia', code: '278516003' },
  { label: '168731009 — Normal Chest Radiograph (Toraks Normal)', text: 'Normal Chest Radiograph (Toraks Normal)', code: '168731009' },
  { label: '154283005 — Pulmonary Tuberculosis', text: 'Pulmonary Tuberculosis', code: '154283005' },
  { label: '840539006 — COVID-19 Lower Respiratory Infection', text: 'COVID-19 with lower respiratory infection', code: '840539006' },
  { label: '8186001 — Cardiomegaly', text: 'Cardiomegaly', code: '8186001' },
];

export default function InputDataModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState(CLINICAL_PRESETS[0].data);
  const [inputMode, setInputMode] = useState('form');
  const [rawJsonText, setRawJsonText] = useState(() =>
    JSON.stringify(CLINICAL_PRESETS[0].data, null, 2)
  );
  const [jsonError, setJsonError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      setRawJsonText(JSON.stringify(updated, null, 2));
      return updated;
    });
  };

  const handleSnomedQuickSelect = (e) => {
    const selectedCode = e.target.value;
    if (!selectedCode) return;
    const found = SNOMED_QUICK_OPTIONS.find((item) => item.code === selectedCode);
    if (found) {
      setFormData((prev) => {
        const updated = {
          ...prev,
          diagnosisText: found.text,
          snomedCode: found.code,
        };
        setRawJsonText(JSON.stringify(updated, null, 2));
        return updated;
      });
    }
  };

  const handleArchiveImageSelect = (e) => {
    const selectedFile = e.target.value;
    if (!selectedFile) return;
    const found = ARCHIVE_IMAGE_SAMPLES.find((item) => item.fileName === selectedFile);
    setFormData((prev) => {
      const updated = {
        ...prev,
        imageFileName: selectedFile,
        ...(found
          ? {
              diagnosisText: found.diagnosisText,
              snomedCode: found.snomedCode,
            }
          : {}),
      };
      setRawJsonText(JSON.stringify(updated, null, 2));
      return updated;
    });
  };

  const handleApplyPreset = (preset) => {
    setFormData(preset.data);
    setRawJsonText(JSON.stringify(preset.data, null, 2));
    setJsonError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMode === 'json') {
      try {
        const parsed = JSON.parse(rawJsonText);
        setJsonError(null);
        onSubmit(parsed);
      } catch (err) {
        setJsonError('Format JSON tidak valid: ' + err.message);
      }
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="simrs-modal-overlay" onClick={onClose}>
      <div className="simrs-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <header className="simrs-modal-header">
          <div>
            <span className="modal-inst-label">RSUD ISTEK &apos;AISYIYAH KENDARI — MODUL INTEROPERABILITAS E-HEALTH</span>
            <h3>Formulir Integrasi Data Rekam Medis &amp; Citra Arsip Radiologi (HL7 FHIR R4)</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} title="Tutup">
            <X size={18} />
          </button>
        </header>

        {/* Bar Pilihan Berkas Sampel dari backend/archive/chest_xray */}
        <div className="simrs-modal-toolbar">
          <div className="toolbar-row-top">
            <span className="toolbar-caption">Pilih Berkas Kasus dari Dataset (<code>backend/archive/chest_xray</code>):</span>
            <div className="mode-toggle-group">
              <button
                type="button"
                className={`mode-toggle-btn ${inputMode === 'form' ? 'active' : ''}`}
                onClick={() => setInputMode('form')}
              >
                Formulir Terstruktur
              </button>
              <button
                type="button"
                className={`mode-toggle-btn ${inputMode === 'json' ? 'active' : ''}`}
                onClick={() => setInputMode('json')}
              >
                Input JSON Mentah
              </button>
            </div>
          </div>

          <div className="preset-buttons-row">
            {CLINICAL_PRESETS.map((preset) => {
              const isSelected = formData.patientId === preset.data.patientId;
              return (
                <button
                  key={preset.data.patientId}
                  type="button"
                  className={`preset-item-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => handleApplyPreset(preset)}
                >
                  <span>{preset.name}</span>
                  <code>{preset.badge}</code>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="simrs-modal-form">
          {inputMode === 'form' ? (
            <div className="simrs-form-columns">
              {/* Bagian 1: Data Kelompok 1 */}
              <fieldset className="simrs-fieldset">
                <legend>A. Data Pasien &amp; Diagnosis Klinis (Kelompok 1)</legend>

                <div className="simrs-field">
                  <label>Nomor Rekam Medis (<code>patientId</code>):</label>
                  <input
                    type="text"
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleChange}
                    placeholder="Contoh: P-001"
                    required
                  />
                </div>

                <div className="simrs-field">
                  <label>Nama Lengkap Pasien (<code>nama</code>):</label>
                  <input
                    type="text"
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    placeholder="Contoh: Budi Santoso"
                    required
                  />
                </div>

                <div className="simrs-field">
                  <label>Jenis Kelamin Administratif (<code>gender</code>):</label>
                  <select name="gender" value={formData.gender} onChange={handleChange}>
                    <option value="male">Laki-laki (male)</option>
                    <option value="female">Perempuan (female)</option>
                    <option value="other">Lainnya (other)</option>
                    <option value="unknown">Tidak Diketahui (unknown)</option>
                  </select>
                </div>

                <div className="simrs-field">
                  <label>Daftar Referensi Cepat SNOMED CT (Opsional):</label>
                  <select value={formData.snomedCode} onChange={handleSnomedQuickSelect}>
                    <option value="">-- Ketik Manual atau Pilih dari Daftar --</option>
                    {SNOMED_QUICK_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="simrs-field-Split">
                  <div className="simrs-field">
                    <label>Teks Diagnosis (<code>diagnosisText</code>):</label>
                    <input
                      type="text"
                      name="diagnosisText"
                      value={formData.diagnosisText}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="simrs-field">
                    <label>Kode SNOMED CT (<code>snomedCode</code>):</label>
                    <input
                      type="text"
                      name="snomedCode"
                      value={formData.snomedCode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </fieldset>

              {/* Bagian 2: Data Kelompok 2 */}
              <fieldset className="simrs-fieldset">
                <legend>B. Metadata &amp; Arsip Citra Radiologi DICOM (Kelompok 2)</legend>

                <div className="simrs-field">
                  <label>Modalitas Radiologi (<code>modality</code>):</label>
                  <select name="modality" value={formData.modality} onChange={handleChange}>
                    <option value="DX">DX — Digital Radiography (Rontgen Digital)</option>
                    <option value="CR">CR — Computed Radiography (Rontgen CR)</option>
                    <option value="CT">CT — Computed Tomography (CT Scan)</option>
                    <option value="MR">MR — Magnetic Resonance Imaging (MRI)</option>
                    <option value="US">US — Ultrasound (USG Diagnostik)</option>
                    <option value="MG">MG — Mammography</option>
                    <option value="XA">XA — X-Ray Angiography</option>
                  </select>
                </div>

                <div className="simrs-field">
                  <label>Tanggal Pemeriksaan (<code>studyDate</code>):</label>
                  <input
                    type="date"
                    name="studyDate"
                    value={formData.studyDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="simrs-field">
                  <label>Pilih Berkas dari <code>backend/archive/chest_xray</code>:</label>
                  <select
                    value={
                      ARCHIVE_IMAGE_SAMPLES.some((s) => s.fileName === formData.imageFileName)
                        ? formData.imageFileName
                        : ''
                    }
                    onChange={handleArchiveImageSelect}
                  >
                    <option value="">-- Pilih dari Katalog Arsip atau Ketik Nama Berkas --</option>
                    {ARCHIVE_IMAGE_SAMPLES.map((item) => (
                      <option key={item.fileName} value={item.fileName}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="simrs-field">
                  <label>Nama Berkas Citra (<code>imageFileName</code>):</label>
                  <input
                    type="text"
                    name="imageFileName"
                    value={formData.imageFileName}
                    onChange={handleChange}
                    placeholder="Contoh: person1946_bacteria_4874.jpeg atau NORMAL2-IM-1427-0001.jpeg"
                    required
                  />
                </div>

                <div className="simrs-mapping-box">
                  <strong>Integrasi Otomatis Direktori <code>backend/archive</code>:</strong>
                  <ul>
                    <li>Mendukung seluruh berkas pada <code>archive/chest_xray/&#123;val,test,train&#125;/&#123;PNEUMONIA,NORMAL&#125;</code>.</li>
                    <li>Target FHIR: <code>DiagnosticReport/DR-{formData.patientId || 'P-001'}</code> &rarr; <code>Patient/{formData.patientId || 'P-001'}</code>.</li>
                  </ul>
                </div>
              </fieldset>
            </div>
          ) : (
            <div className="simrs-json-editor-wrap">
              <label>
                Payload JSON Gabungan untuk dikirim ke <code>POST /api/fhir/combined</code>:
              </label>
              <textarea
                className="simrs-json-textarea"
                rows={11}
                value={rawJsonText}
                onChange={(e) => setRawJsonText(e.target.value)}
              />
              {jsonError && <div className="simrs-json-error">{jsonError}</div>}
            </div>
          )}

          <footer className="simrs-modal-footer">
            <button
              type="button"
              className="btn-simrs btn-simrs-outline"
              onClick={() => handleApplyPreset(CLINICAL_PRESETS[0])}
            >
              <RotateCcw size={14} /> Kembalikan Default (P-001)
            </button>
            <button
              type="submit"
              className="btn-simrs btn-simrs-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Memproses Transformasi FHIR...' : 'Proses & Simpan ke Lembar Kerja'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
