import React, { useState } from 'react';
import { Maximize2, RotateCcw } from 'lucide-react';

const MODALITY_LABELS = {
  DX: 'Digital Radiography (Rontgen Toraks Digital)',
  CR: 'Computed Radiography (Rontgen Konvensional)',
  CT: 'Computed Tomography (CT Scan Toraks)',
  MR: 'Magnetic Resonance Imaging (MRI)',
  US: 'Ultrasound (Ultrasonografi Diagnostik)',
  MG: 'Mammography (Mamografi)',
  XA: 'X-Ray Angiography',
};

function getArchiveMetadata(fileName) {
  const name = String(fileName || '');
  if (name.startsWith('NORMAL')) {
    return {
      folder: `backend/archive/chest_xray/val/NORMAL/${name}`,
      findingGroup: 'NORMAL (Tidak Tampak Infiltrat Paru)',
    };
  }
  if (name.includes('_bacteria_')) {
    return {
      folder: `backend/archive/chest_xray/val/PNEUMONIA/${name}`,
      findingGroup: 'PNEUMONIA — Subtipe Bakterial',
    };
  }
  if (name.includes('_virus_')) {
    return {
      folder: `backend/archive/chest_xray/test/PNEUMONIA/${name}`,
      findingGroup: 'PNEUMONIA — Subtipe Viral',
    };
  }
  return {
    folder: `backend/static/${name}`,
    findingGroup: 'Sampel Radiografi Toraks',
  };
}

export default function RadiologyCard({ diagnosticReport }) {
  const [isInverted, setIsInverted] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showFullImage, setShowFullImage] = useState(false);

  const [urlAttemptState, setUrlAttemptState] = useState({ key: '', stage: 0 });

  if (!diagnosticReport) {
    return (
      <section className="simrs-module-card">
        <div className="module-body-empty">Data radiologi belum tersedia.</div>
      </section>
    );
  }

  const categoryCoding = diagnosticReport.category?.[0]?.coding?.[0] || {};
  const modality = (categoryCoding.code || 'DX').toUpperCase();
  const modalityDisplay =
    MODALITY_LABELS[modality] || categoryCoding.display || 'Digital Radiography';

  const studyDate = diagnosticReport.effectiveDateTime || '-';
  const presentedForm = diagnosticReport.presentedForm?.[0] || {};
  const imageFileName =
    presentedForm.title ||
    presentedForm.url?.split('/')?.pop() ||
    'sample_chest_xray.jpg';

  const subjectDisplay = diagnosticReport.subject?.display || 'Pasien RME';
  const subjectRef = diagnosticReport.subject?.reference || 'Patient/P-001';
  const reportId = diagnosticReport.id || 'DR-P-001';
  const archiveInfo = getArchiveMetadata(imageFileName);

  const primaryUrl = presentedForm.url || `/static/${imageFileName}`;
  const candidateUrls = [
    primaryUrl,
    primaryUrl.startsWith('http')
      ? primaryUrl
      : `http://localhost:8000/static/${encodeURIComponent(imageFileName)}`,
    `/${encodeURIComponent(imageFileName)}`,
  ];

  const currentReportKey = `${reportId}::${imageFileName}::${studyDate}`;
  const activeStage = urlAttemptState.key === currentReportKey ? urlAttemptState.stage : 0;
  const imageError = activeStage >= candidateUrls.length;
  const resolvedImageUrl = !imageError ? candidateUrls[activeStage] : '';

  const handleImageError = () => {
    setUrlAttemptState((prev) => {
      const currentStage = prev.key === currentReportKey ? prev.stage : 0;
      return {
        key: currentReportKey,
        stage: currentStage + 1,
      };
    });
  };

  const handleResetView = () => {
    setIsInverted(false);
    setHighContrast(false);
    setZoomLevel(1);
  };

  const handleZoomToggle = () => {
    setZoomLevel((prev) => (prev >= 1.5 ? 1 : Number((prev + 0.25).toFixed(2))));
  };

  const imageFilterStyle = {
    filter: `${isInverted ? 'invert(1) ' : ''}${
      highContrast ? 'contrast(1.45) brightness(0.95)' : 'contrast(1.08) brightness(0.97)'
    }`,
    transform: `scale(${zoomLevel})`,
  };

  return (
    <section className="simrs-module-card" aria-labelledby="rm03-title">
      <header className="module-header">
        <div className="module-header-left">
          <span className="form-code-badge">RM-03</span>
          <div>
            <h2 id="rm03-title" className="module-title">Pemeriksaan Radiologi (DICOM)</h2>
            <p className="module-subtitle">Resource HL7 FHIR R4: <code>DiagnosticReport</code></p>
          </div>
        </div>
        <span className="doc-status-badge status-modality">
          MODALITAS: {modality}
        </span>
      </header>

      <div className="module-body">
        {/* Panel Penampil Citra PACS */}
        <div className="pacs-frame">
          <div className="pacs-control-bar">
            <span className="pacs-caption">CITRA RADIOLOGI • {modality}</span>
            <div className="pacs-btn-group">
              <button
                type="button"
                className={`pacs-btn ${isInverted ? 'is-active' : ''}`}
                onClick={() => setIsInverted(!isInverted)}
                title="Mode Negatif (Invert Grayscale)"
              >
                Negatif
              </button>
              <button
                type="button"
                className={`pacs-btn ${highContrast ? 'is-active' : ''}`}
                onClick={() => setHighContrast(!highContrast)}
                title="Tingkatkan Kontras Paru"
              >
                Kontras+
              </button>
              <button
                type="button"
                className={`pacs-btn ${zoomLevel > 1 ? 'is-active' : ''}`}
                onClick={handleZoomToggle}
                title="Perbesar Citra"
              >
                Zoom {Math.round(zoomLevel * 100)}%
              </button>
              {(isInverted || highContrast || zoomLevel > 1) && (
                <button
                  type="button"
                  className="pacs-btn"
                  onClick={handleResetView}
                  title="Kembalikan Tampilan Awal"
                >
                  <RotateCcw size={11} />
                </button>
              )}
              {!imageError && (
                <button
                  type="button"
                  className="pacs-btn pacs-btn-fullscreen"
                  onClick={() => setShowFullImage(true)}
                  title="Perbesar Citra ke Layar Penuh"
                >
                  <Maximize2 size={11} /> Perbesar
                </button>
              )}
            </div>
          </div>

          {!imageError ? (
            <div className="pacs-viewport">
              <img
                key={resolvedImageUrl}
                src={resolvedImageUrl}
                alt={`Citra Radiologi ${subjectDisplay}`}
                className="pacs-img"
                style={imageFilterStyle}
                onError={handleImageError}
              />
              <div className="pacs-hud hud-tl">
                <div>{subjectDisplay.toUpperCase()}</div>
                <div>{subjectRef}</div>
              </div>
              <div className="pacs-hud hud-tr">
                <div>RSUD ISTEK &apos;AISYIYAH KENDARI</div>
                <div>TGL: {studyDate}</div>
              </div>
              <div className="pacs-hud hud-bl">
                BERKAS: {imageFileName}
              </div>
              <div className="pacs-hud hud-br">
                MOD: {modality} {isInverted ? '| NEG' : ''}
              </div>
            </div>
          ) : (
            <div className="pacs-fallback-box">
              <strong>Citra Eksternal: {imageFileName}</strong>
              <span>Modalitas: {modality} | Tanggal: {studyDate}</span>
              <p>
                File fisik <code>{imageFileName}</code> tidak terdapat pada folder statis lokal. Gunakan <code>sample_chest_xray.jpg</code> untuk menampilkan sampel foto toraks.
              </p>
            </div>
          )}
        </div>

        {/* Lightbox Citra Penuh */}
        {showFullImage && !imageError && (
          <div className="simrs-modal-overlay" onClick={() => setShowFullImage(false)}>
            <div className="pacs-lightbox-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="lightbox-header">
                <div>
                  <strong>Instalasi Radiologi RSUD ISTEK &apos;Aisyiyah Kendari — {subjectDisplay}</strong>
                  <span className="lightbox-sub">
                    No. Laporan: {reportId} | Modalitas: {modality} ({modalityDisplay}) | Tanggal: {studyDate}
                  </span>
                </div>
                <div className="pacs-btn-group">
                  <button
                    type="button"
                    className={`pacs-btn ${isInverted ? 'is-active' : ''}`}
                    onClick={() => setIsInverted(!isInverted)}
                  >
                    Negatif
                  </button>
                  <button
                    type="button"
                    className={`pacs-btn ${highContrast ? 'is-active' : ''}`}
                    onClick={() => setHighContrast(!highContrast)}
                  >
                    Kontras+
                  </button>
                  <button
                    type="button"
                    className="pacs-btn"
                    onClick={() => setShowFullImage(false)}
                  >
                    Tutup ✕
                  </button>
                </div>
              </div>
              <div className="lightbox-body">
                <img
                  src={resolvedImageUrl}
                  alt="Tampilan Penuh Radiologi"
                  className="lightbox-img"
                  style={{ filter: imageFilterStyle.filter }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tabel Metadata DICOM */}
        <table className="simrs-data-table">
          <tbody>
            <tr>
              <th>Modalitas DICOM</th>
              <td>{modality} — {modalityDisplay}</td>
            </tr>
            <tr>
              <th>Tanggal Pemeriksaan</th>
              <td className="mono-cell">{studyDate}</td>
            </tr>
            <tr>
              <th>Nama Berkas Citra</th>
              <td className="mono-cell">{imageFileName}</td>
            </tr>
            <tr>
              <th>Kategori Dataset Arsip</th>
              <td>{archiveInfo.findingGroup}</td>
            </tr>
            <tr>
              <th>Lokasi Arsip (<code>archive</code>)</th>
              <td className="mono-cell">{archiveInfo.folder}</td>
            </tr>
            <tr>
              <th>Asal Subsistem Data</th>
              <td>
                <span className="source-tag">Kelompok 2 — Metadata DICOM Radiologi</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
