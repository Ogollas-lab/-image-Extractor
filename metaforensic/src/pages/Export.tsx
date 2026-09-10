import { useFile } from '../context/FileContext';
import { useNavigate } from '@tanstack/react-router';
import { Download, FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import { ExportService } from '../services/export.service';
import { PrivacyService } from '../services/privacy.service';
import { useState } from 'react';

export function Export() {
  const { file, metadata } = useFile();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);

  if (!file || !metadata) {
    navigate({ to: '/' });
    return null;
  }

  const privacy = PrivacyService.analyze(metadata);

  const exportJSON = () => {
    ExportService.exportJSON(file, metadata, privacy);
  };

  const exportCSV = () => {
    ExportService.exportCSV(file, metadata);
  };

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const objectUrl = URL.createObjectURL(file);
      await ExportService.exportPDF(file, objectUrl, metadata, privacy);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate PDF report.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h2 className="text-lg font-medium tracking-wide text-slate-300 uppercase border-b border-[var(--color-charcoal-700)] pb-2">
        EXPORT DATA & REPORTING
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          className="panel p-6 flex flex-col items-center text-center group hover:bg-[var(--color-charcoal-700)] transition-colors cursor-pointer border-[var(--color-accent-cyan)]/30"
          onClick={exportJSON}
        >
          <FileJson className="w-10 h-10 mb-4 text-[var(--color-accent-cyan)]" />
          <h3 className="font-semibold text-slate-200 mb-1">JSON Export</h3>
          <p className="text-xs text-slate-400 mb-6">
            Raw structured data including privacy findings. Suitable for programmatic analysis.
          </p>
          <div className="mt-auto flex items-center space-x-2 text-[var(--color-accent-cyan)] text-sm font-medium">
            <Download className="w-4 h-4" />
            <span>DOWNLOAD</span>
          </div>
        </div>

        <div
          className="panel p-6 flex flex-col items-center text-center group hover:bg-[var(--color-charcoal-700)] transition-colors cursor-pointer border-[var(--color-accent-green)]/30"
          onClick={exportCSV}
        >
          <FileSpreadsheet className="w-10 h-10 mb-4 text-[var(--color-accent-green)]" />
          <h3 className="font-semibold text-slate-200 mb-1">CSV Export</h3>
          <p className="text-xs text-slate-400 mb-6">
            Flattened tabular data categorized for spreadsheets and databases.
          </p>
          <div className="mt-auto flex items-center space-x-2 text-[var(--color-accent-green)] text-sm font-medium">
            <Download className="w-4 h-4" />
            <span>DOWNLOAD</span>
          </div>
        </div>

        <div
          className={`panel p-6 flex flex-col items-center text-center transition-colors border-[var(--color-accent-amber)]/30 ${
            isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer group hover:bg-[var(--color-charcoal-700)]'
          }`}
          onClick={!isExporting ? exportPDF : undefined}
        >
          <FileText className="w-10 h-10 mb-4 text-[var(--color-accent-amber)]" />
          <h3 className="font-semibold text-slate-200 mb-1">PDF Report</h3>
          <p className="text-xs text-slate-400 mb-6">
            Professional multi-page document featuring privacy findings and full data extracts.
          </p>
          <div className="mt-auto flex items-center space-x-2 text-[var(--color-accent-amber)] text-sm font-medium">
            {isExporting ? (
              <span className="animate-pulse">GENERATING...</span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>DOWNLOAD</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
