import React from 'react';
import { ExternalLink } from 'lucide-react';

function getClinicalClassification(snomedCode, diagnosisText) {
  const code = String(snomedCode || '').trim();
  const text = String(diagnosisText || '').toLowerCase();

  const knownCodes = {
    '233604007': {
      icd10: 'J18.9 — Pneumonia, unspecified organism',
      category: 'Infeksi Saluran Pernapasan Bawah Akut (Pneumonia)',
      department: 'Poli Spesialis Paru / Respirasi',
    },
    '53084003': {
      icd10: 'J15.9 — Bacterial pneumonia, unspecified',
      category: 'Pneumonia Bakterial (Infiltrat Alveolar)',
      department: 'Poli Spesialis Paru / Respirasi',
    },
    '75570004': {
      icd10: 'J12.9 — Viral pneumonia, unspecified',
      category: 'Pneumonia Viral (Corakan Interstisial Bilik Paru)',
      department: 'Poli Spesialis Paru & Penyakit Dalam',
    },
    '278516003': {
      icd10: 'J18.1 — Lobar pneumonia, unspecified organism',
      category: 'Pneumonia Lobaris Bakterial',
      department: 'Poli Spesialis Paru / Respirasi',
    },
    '168731009': {
      icd10: 'Z01.89 — Standard chest X-ray normal',
      category: 'Temuan Radiografi Toraks Normal (Cor & Pulmo Normal)',
      department: 'Instalasi Radiologi & Medical Check-Up',
    },
    '154283005': {
      icd10: 'A15.0 — Tuberculosis of lung',
      category: 'Infeksi Mikobakterium Paru (TB Paru)',
      department: 'Poli Paru / Layanan DOTS TB',
    },
    '840539006': {
      icd10: 'U07.1 / J12.82 — COVID-19 respiratory infection',
      category: 'Infeksi Virus Akut Saluran Pernapasan',
      department: 'Poli Penyakit Dalam & Paru',
    },
    '8186001': {
      icd10: 'I51.7 — Cardiomegaly',
      category: 'Kelainan Struktural Kardiovaskular (CTR > 50%)',
      department: 'Poli Jantung & Pembuluh Darah',
    },
    '60046008': {
      icd10: 'J90 — Pleural effusion, not elsewhere classified',
      category: 'Akumulasi Cairan Rongga Pleura Toraks',
      department: 'Poli Spesialis Paru & Bedah Toraks',
    },
    '363680008': {
      icd10: 'Z01.89 — Encounter for other specified special examinations',
      category: 'Prosedur Pemeriksaan Pencitraan Radiologi',
      department: 'Instalasi Radiologi Diagnostik',
    },
  };

  if (knownCodes[code]) {
    return knownCodes[code];
  }

  if (text.includes('pneumo')) return knownCodes['233604007'];
  if (text.includes('tuberc') || text.includes('tb ') || text.includes('tbc')) {
    return knownCodes['154283005'];
  }
  if (text.includes('covid') || text.includes('corona') || text.includes('sars')) {
    return knownCodes['840539006'];
  }
  if (text.includes('cardio') || text.includes('jantung') || text.includes('heart')) {
    return knownCodes['8186001'];
  }
  if (text.includes('pleur') || text.includes('efusi')) {
    return knownCodes['60046008'];
  }
  if (text.includes('fractur') || text.includes('fraktur') || text.includes('patah')) {
    return {
      icd10: 'S22.9 — Fracture of bony thorax',
      category: 'Trauma Muskuloskeletal & Toraks',
      department: 'Poli Bedah Ortopedi & Traumatologi',
    };
  }
  if (text.includes('bronch') || text.includes('bronkitis') || text.includes('asthma') || text.includes('asma')) {
    return {
      icd10: 'J40 / J45 — Bronchial & obstructive airway disease',
      category: 'Penyakit Saluran Napas Obstruktif / Bronkial',
      department: 'Poli Spesialis Paru / Respirasi',
    };
  }

  return {
    icd10: 'R91.8 — Other nonspecific abnormal finding of lung field',
    category: `Temuan Klinis Terkode (${diagnosisText || 'Umum'})`,
    department: 'Instalasi Rawat Jalan & Radiologi',
  };
}

export default function DiagnosisCard({ diagnosticReport }) {
  if (!diagnosticReport) {
    return (
      <section className="simrs-module-card">
        <div className="module-body-empty">Data diagnosis belum tersedia.</div>
      </section>
    );
  }

  const codeObj = diagnosticReport.code || {};
  const coding = codeObj.coding?.[0] || {};

  const diagnosisText = coding.display || codeObj.text || 'Tidak Ada Diagnosis';
  const snomedCode = coding.code || '-';
  const codingSystem = coding.system || 'http://snomed.info/sct';
  const reportStatus = (diagnosticReport.status || 'final').toUpperCase();
  const subjectRef = diagnosticReport.subject?.reference || '-';

  const clinicalMeta = getClinicalClassification(snomedCode, diagnosisText);

  return (
    <section className="simrs-module-card" aria-labelledby="rm02-title">
      <header className="module-header">
        <div className="module-header-left">
          <span className="form-code-badge">RM-02</span>
          <div>
            <h2 id="rm02-title" className="module-title">Diagnosa &amp; Koding Klinis</h2>
            <p className="module-subtitle">Standar Terminologi: <code>SNOMED CT</code></p>
          </div>
        </div>
        <span className="doc-status-badge status-verified">
          STATUS: {reportStatus}
        </span>
      </header>

      <div className="module-body">
        {/* Kotak Ringkasan Diagnosa Kerja */}
        <div className="rm-diagnosis-sheet">
          <div className="diag-sheet-header">
            <span>DIAGNOSA KERJA UTAMA (PRIMARY CLINICAL FINDING)</span>
            <a
              href={`https://browser.ihtsdotools.org/?perspective=full&conceptId1=${encodeURIComponent(snomedCode)}`}
              target="_blank"
              rel="noreferrer"
              className="snomed-ref-link"
              title="Verifikasi kode pada SNOMED CT International Browser"
            >
              Referensi SNOMED <ExternalLink size={11} />
            </a>
          </div>
          <div className="diag-sheet-main">{diagnosisText}</div>
          <div className="diag-sheet-code-row">
            <span className="code-box-label">SNOMED CT Concept ID:</span>
            <code className="code-box-value">{snomedCode}</code>
          </div>
        </div>

        {/* Tabel Rincian Terminologi & Pemetaan FHIR */}
        <table className="simrs-data-table">
          <tbody>
            <tr>
              <th>Klasifikasi Medis</th>
              <td>{clinicalMeta.category}</td>
            </tr>
            <tr>
              <th>Padanan Kode ICD-10</th>
              <td className="mono-cell">{clinicalMeta.icd10}</td>
            </tr>
            <tr>
              <th>Unit Layanan Terkait</th>
              <td>{clinicalMeta.department}</td>
            </tr>
            <tr>
              <th>Sistem Koding (<code>system</code>)</th>
              <td className="mono-cell">{codingSystem}</td>
            </tr>
            <tr>
              <th>Relasi Subjek (<code>subject</code>)</th>
              <td className="mono-cell">{subjectRef}</td>
            </tr>
            <tr>
              <th>ID Laporan FHIR</th>
              <td className="mono-cell">DiagnosticReport/{diagnosticReport.id || '-'}</td>
            </tr>
            <tr>
              <th>Asal Subsistem Data</th>
              <td>
                <span className="source-tag">Kelompok 1 — Koding Diagnosis SNOMED</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
