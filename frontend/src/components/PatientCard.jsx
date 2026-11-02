import React from 'react';

export default function PatientCard({ patient }) {
  if (!patient) {
    return (
      <section className="simrs-module-card">
        <div className="module-body-empty">Data pasien belum tersedia.</div>
      </section>
    );
  }

  const name = patient.name?.[0]?.text || 'Tidak Diketahui';
  const patientId = patient.identifier?.[0]?.value || patient.id || '-';
  const fhirId = patient.id || '-';
  const gender = (patient.gender || 'unknown').toLowerCase();
  const identifierSystem =
    patient.identifier?.[0]?.system || 'http://ehealth.kelompok3.local/mrn';
  const isActive = patient.active !== undefined ? patient.active : true;

  const getSalutation = (g, fullName) => {
    if (/^(dr\.|tn\.|ny\.|nn\.|an\.)/i.test(fullName)) return '';
    if (g === 'male') return 'Tn. ';
    if (g === 'female') return 'Ny. ';
    return '';
  };

  const getGenderLabel = (g) => {
    switch (g) {
      case 'male':
        return 'Laki-laki (male)';
      case 'female':
        return 'Perempuan (female)';
      case 'other':
        return 'Lainnya (other)';
      default:
        return 'Tidak Diketahui (unknown)';
    }
  };

  return (
    <section className="simrs-module-card" aria-labelledby="rm01-title">
      <header className="module-header">
        <div className="module-header-left">
          <span className="form-code-badge">RM-01</span>
          <div>
            <h2 id="rm01-title" className="module-title">Data Identitas Pasien</h2>
            <p className="module-subtitle">Resource HL7 FHIR R4: <code>Patient</code></p>
          </div>
        </div>
        <span className={`doc-status-badge ${isActive ? 'status-verified' : ''}`}>
          {isActive ? 'BERKAS AKTIF' : 'NONAKTIF'}
        </span>
      </header>

      <div className="module-body">
        {/* Blok Utama Identitas Rekam Medis */}
        <div className="rm-identity-box">
          <div className="rm-number-block">
            <span className="rm-number-caption">NOMOR REKAM MEDIS</span>
            <strong className="rm-number-value">{patientId}</strong>
          </div>
          <div className="rm-name-block">
            <span className="rm-name-caption">NAMA PASIEN SESUAI IDENTITAS</span>
            <strong className="rm-name-value">
              {getSalutation(gender, name)}{name}
            </strong>
          </div>
        </div>

        {/* Tabel Data Administratif & Pemetaan FHIR */}
        <table className="simrs-data-table">
          <tbody>
            <tr>
              <th>Nama Resmi (<code>name[0].text</code>)</th>
              <td>{name}</td>
            </tr>
            <tr>
              <th>Jenis Kelamin (<code>gender</code>)</th>
              <td>
                <span className="clinical-inline-tag">{getGenderLabel(gender)}</span>
              </td>
            </tr>
            <tr>
              <th>ID Resource FHIR</th>
              <td className="mono-cell">Patient/{fhirId}</td>
            </tr>
            <tr>
              <th>Sistem Identifier (URI)</th>
              <td className="mono-cell" title={identifierSystem}>
                {identifierSystem}
              </td>
            </tr>
            <tr>
              <th>Fasilitas Pelayanan</th>
              <td>RSUD ISTEK &apos;Aisyiyah Kendari</td>
            </tr>
            <tr>
              <th>Instalasi / Poliklinik</th>
              <td>Poli Paru &amp; Instalasi Radiologi</td>
            </tr>
            <tr>
              <th>Asal Subsistem Data</th>
              <td>
                <span className="source-tag">Kelompok 1 — Pendaftaran RME</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
