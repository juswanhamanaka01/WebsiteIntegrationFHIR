import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight, Download } from 'lucide-react';

export default function FhirJsonViewer({ patient, diagnosticReport }) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('patient');
  const [copied, setCopied] = useState(false);

  const combinedPayload = {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: `${diagnosticReport?.effectiveDateTime || '2026-10-24'}T08:00:00Z`,
    entry: [
      {
        fullUrl: `http://ehealth.kelompok3.local/fhir/Patient/${patient?.id || 'P-001'}`,
        resource: patient,
      },
      {
        fullUrl: `http://ehealth.kelompok3.local/fhir/DiagnosticReport/${diagnosticReport?.id || 'DR-P-001'}`,
        resource: diagnosticReport,
      },
    ],
  };

  const getCurrentPayload = () => {
    if (activeTab === 'patient') return patient;
    if (activeTab === 'report') return diagnosticReport;
    return combinedPayload;
  };

  const currentJson = JSON.stringify(getCurrentPayload(), null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const patId = patient?.id || 'sample';
    link.href = url;
    link.download = `fhir-r4-${activeTab}-${patId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="simrs-module-card fhir-log-card" aria-labelledby="fhir-log-title">
      <header
        className="module-header module-header-clickable"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="module-header-left">
          <span className="form-code-badge">FHIR-R4</span>
          <div>
            <h2 id="fhir-log-title" className="module-title">
              Log Payload Interoperabilitas HL7 FHIR Release 4 (Raw JSON)
            </h2>
            <p className="module-subtitle">
              Hasil serialisasi dan validasi skema oleh pustaka <code>fhir.resources.R4B</code> pada server FastAPI
            </p>
          </div>
        </div>
        <div className="module-header-right">
          <span className="doc-status-badge status-verified">SCHEMA VALID (R4 v4.3.0)</span>
          <button type="button" className="toggle-log-btn">
            {isOpen ? (
              <>Sembunyikan <ChevronDown size={15} /></>
            ) : (
              <>Tampilkan JSON <ChevronRight size={15} /></>
            )}
          </button>
        </div>
      </header>

      {isOpen && (
        <div className="fhir-log-body">
          {/* Bar Ringkasan Pemetaan Referensi */}
          <div className="fhir-mapping-summary">
            <span>
              <strong>Relasi Resource:</strong> <code>DiagnosticReport.subject.reference</code> &rarr; <code>&quot;{diagnosticReport?.subject?.reference || '-'}&quot;</code>
            </span>
            <span>
              <strong>Sistem Terminologi:</strong> <code>http://snomed.info/sct#{diagnosticReport?.code?.coding?.[0]?.code || '-'}</code>
            </span>
            <span>
              <strong>Kategori HL7 v2-0074:</strong> <code>{diagnosticReport?.category?.[0]?.coding?.[0]?.code || '-'}</code>
            </span>
          </div>

          <div className="fhir-log-toolbar">
            <div className="fhir-tab-group">
              <button
                type="button"
                className={`fhir-tab ${activeTab === 'patient' ? 'active' : ''}`}
                onClick={() => setActiveTab('patient')}
              >
                Resource: Patient (Kelompok 1)
              </button>
              <button
                type="button"
                className={`fhir-tab ${activeTab === 'report' ? 'active' : ''}`}
                onClick={() => setActiveTab('report')}
              >
                Resource: DiagnosticReport (Kelompok 2 + Diagnosis)
              </button>
              <button
                type="button"
                className={`fhir-tab ${activeTab === 'bundle' ? 'active' : ''}`}
                onClick={() => setActiveTab('bundle')}
              >
                Bundle Gabungan (Collection)
              </button>
            </div>

            <div className="fhir-actions-group">
              <button type="button" className="fhir-action-btn" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check size={13} /> Tersalin
                  </>
                ) : (
                  <>
                    <Copy size={13} /> Salin JSON
                  </>
                )}
              </button>
              <button type="button" className="fhir-action-btn" onClick={handleDownload}>
                <Download size={13} /> Unduh Berkas .JSON
              </button>
            </div>
          </div>

          <div className="fhir-code-container">
            <pre className="fhir-pre">
              <code>{currentJson || '// Data JSON kosong'}</code>
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
