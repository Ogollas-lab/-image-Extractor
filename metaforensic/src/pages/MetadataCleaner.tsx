import { useState } from 'react';
import { useFile } from '../context/FileContext';
import { useNavigate } from '@tanstack/react-router';
import { Trash, Shield, AlertTriangle, Check, Download, ShieldCheck, Info } from 'lucide-react';
import { CleanerService } from '../services/cleaner.service';
import { MetadataService } from '../services/metadata.service';
import { PrivacyService } from '../services/privacy.service';
import { HashService } from '../services/hash.service';
import { VerificationService } from '../services/verification.service';
import type { CleanOptions } from '../types/cleaner.types';
import type { ExtractedMetadata, PrivacyReport, VerificationReport } from '../types/metadata.types';

export function MetadataCleaner() {
  const { file, metadata } = useFile();
  const navigate = useNavigate();

  const [options, setOptions] = useState<CleanOptions>({
    gps: true,
    timestamps: true,
    camera: true,
    author: true,
    all: false,
  });

  const [isCleaning, setIsCleaning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verification state
  const [cleanedUrl, setCleanedUrl] = useState<string | null>(null);
  const [limitations, setLimitations] = useState<string[]>([]);
  const [verifiedMetadata, setVerifiedMetadata] = useState<ExtractedMetadata | null>(null);
  const [verifiedPrivacy, setVerifiedPrivacy] = useState<PrivacyReport | null>(null);
  const [verificationReport, setVerificationReport] = useState<VerificationReport | null>(null);

  if (!file || !metadata) {
    navigate({ to: '/' });
    return null;
  }

  const originalPrivacy = PrivacyService.analyze(metadata);
  const isJpeg = file.type === 'image/jpeg';

  const handleToggle = (key: keyof CleanOptions) => {
    if (key === 'all') {
      const newValue = !options.all;
      setOptions({
        gps: newValue,
        timestamps: newValue,
        camera: newValue,
        author: newValue,
        all: newValue,
      });
    } else {
      setOptions((prev) => ({ ...prev, [key]: !prev[key], all: false }));
    }
  };

  const processClean = async () => {
    setIsCleaning(true);
    setError(null);
    setCleanedUrl(null);
    setVerifiedMetadata(null);
    setVerifiedPrivacy(null);

    try {
      // 1. Get original hash
      const originalHash = await HashService.calculateSHA256(file);

      // 2. Clean the image
      const result = await CleanerService.cleanImage(file, options);
      
      // 3. Verify the new blob
      const cleanedHash = await HashService.calculateSHA256(result.blob);
      const newFile = new File([result.blob], `cleaned_${file.name}`, { type: result.blob.type });
      const newMetadata = await MetadataService.extractMetadata(newFile);
      const newPrivacy = PrivacyService.analyze(newMetadata);

      // 4. Generate Verification Report
      const report = VerificationService.verify(metadata, newMetadata, originalHash, cleanedHash, result.limitations);

      setVerifiedMetadata(newMetadata);
      setVerifiedPrivacy(newPrivacy);
      setVerificationReport(report);
      setCleanedUrl(result.objectUrl);
      setLimitations(report.limitations);
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during cleaning.');
    } finally {
      setIsCleaning(false);
    }
  };

  const handleDownload = () => {
    if (!cleanedUrl) return;
    const link = document.createElement('a');
    link.href = cleanedUrl;
    link.download = `cleaned_${file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h2 className="text-lg font-medium tracking-wide text-slate-300 uppercase border-b border-[var(--color-charcoal-700)] pb-2">
        METADATA CLEANER ENGINE
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT PANEL: OPTIONS */}
        <div className="space-y-6">
          <div className="panel p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
                Select Removal Targets
              </h3>
              {!isJpeg && (
                <span className="text-[10px] font-bold bg-[var(--color-accent-amber)]/20 text-[var(--color-accent-amber)] px-2 py-1 rounded">
                  {file.type.toUpperCase()} DETECTED
                </span>
              )}
            </div>

            {/* Warning for non-JPEG */}
            {!isJpeg && (
              <div className="p-4 bg-[var(--color-accent-amber)]/10 border border-[var(--color-accent-amber)]/30 rounded text-sm text-[var(--color-accent-amber)] mb-4 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>
                  Selective metadata removal is only supported for JPEG files. Because this is a <strong>{file.type}</strong>, 
                  the cleaner must use a full rendering fallback. <strong>All metadata will be stripped</strong> regardless of the specific options selected below.
                </p>
              </div>
            )}

            <div className={`space-y-3 ${!isJpeg ? 'opacity-50 pointer-events-none' : ''}`}>
              {[
                { id: 'gps', label: 'Remove GPS Location Data' },
                { id: 'timestamps', label: 'Remove Capture Timestamps' },
                { id: 'camera', label: 'Remove Camera Information' },
                { id: 'author', label: 'Remove Author/Software Data' },
              ].map(({ id, label }) => (
                <label
                  key={id}
                  onClick={() => handleToggle(id as keyof CleanOptions)}
                  className="flex items-center space-x-3 cursor-pointer group"
                >
                  <div
                    className={`w-5 h-5 border flex items-center justify-center transition-colors ${
                      options[id as keyof CleanOptions]
                        ? 'bg-[var(--color-accent-cyan)] border-[var(--color-accent-cyan)] text-[var(--color-charcoal-900)]'
                        : 'border-[var(--color-charcoal-600)] group-hover:border-[var(--color-charcoal-500)]'
                    }`}
                  >
                    {options[id as keyof CleanOptions] && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                    {label}
                  </span>
                </label>
              ))}
            </div>

            <div className="pt-4 mt-4 border-t border-[var(--color-charcoal-700)]">
              <label
                onClick={() => handleToggle('all')}
                className="flex items-center space-x-3 cursor-pointer group"
              >
                <div
                  className={`w-5 h-5 border flex items-center justify-center transition-colors ${
                    options.all || !isJpeg // Visually check "all" if it's not a jpeg
                      ? 'bg-[var(--color-accent-red)] border-[var(--color-accent-red)] text-white'
                      : 'border-[var(--color-charcoal-600)] group-hover:border-[var(--color-charcoal-500)]'
                  }`}
                >
                  {(options.all || !isJpeg) && <Check className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-sm font-medium transition-colors ${options.all || !isJpeg ? 'text-[var(--color-accent-red)]' : 'text-slate-400'}`}>
                  Strip All Metadata (Recommended)
                </span>
              </label>
            </div>
          </div>

          <button
            onClick={processClean}
            disabled={isCleaning}
            className="w-full panel p-4 flex items-center justify-center space-x-3 bg-[var(--color-charcoal-800)] hover:bg-[var(--color-charcoal-700)] transition-colors text-[var(--color-accent-cyan)] disabled:opacity-50 disabled:cursor-not-allowed border border-[var(--color-accent-cyan)]/30"
          >
            {isCleaning ? (
              <span className="animate-pulse tracking-wide font-medium">CLEANING AND VERIFYING...</span>
            ) : (
              <>
                <Trash className="w-5 h-5" />
                <span className="font-bold tracking-widest text-sm">EXECUTE CLEANING</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-4 border border-[var(--color-accent-red)]/30 bg-[var(--color-accent-red)]/10 text-red-200 flex items-start space-x-3 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 text-[var(--color-accent-red)]" />
              <p>{error}</p>
            </div>
          )}

          <div className="p-4 border border-[var(--color-accent-amber)]/30 bg-[var(--color-accent-amber)]/5 flex items-start space-x-3 text-sm">
            <Shield className="w-5 h-5 shrink-0 text-[var(--color-accent-amber)]" />
            <p className="text-slate-400 leading-relaxed">
              <strong>Zero-Overwrite Guarantee:</strong> The original file on your disk is never modified. 
              The engine reads the file, cleans the metadata in-memory, and generates a new secure copy for you to download.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL: VERIFICATION DASHBOARD */}
        <div className="panel p-0 overflow-hidden flex flex-col min-h-[450px]">
          <div className="bg-[var(--color-charcoal-800)] p-4 border-b border-[var(--color-charcoal-700)] flex justify-between items-center">
            <h3 className="text-xs font-semibold tracking-widest text-slate-400 uppercase flex items-center">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Verification Dashboard
            </h3>
            {cleanedUrl && (
              <span className="text-[10px] bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)] px-2 py-1 uppercase tracking-wider font-bold">
                Verified Clean
              </span>
            )}
          </div>

          <div className="p-6 flex-1 flex flex-col">
            {!cleanedUrl && !isCleaning ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
                <Trash className="w-12 h-12 opacity-20" />
                <p className="text-sm max-w-xs text-center">
                  Select your removal options and execute cleaning to generate a verified, secure copy of this image.
                </p>
              </div>
            ) : isCleaning ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-2 border-[var(--color-charcoal-700)] border-t-[var(--color-accent-cyan)] rounded-full animate-spin"></div>
                <p className="text-sm text-[var(--color-accent-cyan)] font-mono animate-pulse">Processing image...</p>
              </div>
            ) : verifiedMetadata && verifiedPrivacy && verificationReport ? (
              <div className="space-y-6 flex-1 flex flex-col overflow-y-auto pr-2">
                
                {/* Status Badge */}
                <div className={`p-4 rounded-lg flex items-center justify-between border ${
                  verificationReport.status === 'VERIFIED CLEAN' ? 'bg-[var(--color-accent-green)]/10 border-[var(--color-accent-green)]/30 text-[var(--color-accent-green)]' :
                  verificationReport.status === 'CLEAN WITH LIMITATIONS' ? 'bg-[var(--color-accent-amber)]/10 border-[var(--color-accent-amber)]/30 text-[var(--color-accent-amber)]' :
                  'bg-[var(--color-accent-red)]/10 border-[var(--color-accent-red)]/30 text-[var(--color-accent-red)]'
                }`}>
                  <div className="flex items-center space-x-3">
                    {verificationReport.status === 'VERIFIED CLEAN' ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                    <div>
                      <p className="text-xs font-bold tracking-widest uppercase">Verification Status</p>
                      <p className="text-lg font-medium">{verificationReport.status}</p>
                    </div>
                  </div>
                </div>

                {/* Hashes */}
                <div className="bg-[var(--color-charcoal-900)] p-4 rounded-lg border border-[var(--color-charcoal-700)] space-y-2">
                  <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Cryptographic Hashes (SHA-256)</h4>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Original</span>
                    <span className="font-mono text-[var(--color-accent-cyan)]">{verificationReport.originalHash}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Cleaned</span>
                    <span className="font-mono text-[var(--color-accent-cyan)]">{verificationReport.cleanedHash}</span>
                  </div>
                </div>

                {/* Image Previews */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest text-center">Original Image</p>
                    <div className="w-full aspect-video bg-[var(--color-charcoal-900)] border border-[var(--color-charcoal-700)] rounded flex items-center justify-center overflow-hidden">
                      <img src={URL.createObjectURL(file)} alt="Original" className="max-w-full max-h-full object-contain opacity-50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-[var(--color-accent-green)] uppercase tracking-widest text-center">Cleaned Image</p>
                    <div className="w-full aspect-video bg-[var(--color-charcoal-900)] border border-[var(--color-accent-green)]/30 rounded flex items-center justify-center overflow-hidden relative">
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-[var(--color-accent-green)]"></div>
                      <img src={cleanedUrl || ''} alt="Cleaned" className="max-w-full max-h-full object-contain" />
                    </div>
                  </div>
                </div>

                {/* Comparison Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--color-charcoal-900)] p-4 rounded-lg border border-[var(--color-charcoal-700)] text-center">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-500">Privacy Exposure</span>
                      <span className="text-lg text-[var(--color-accent-red)]">{originalPrivacy.exposureScore}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Metadata Tags</span>
                      <span className="text-sm text-slate-300">{metadata.totalCount}</span>
                    </div>
                  </div>
                  
                  <div className="bg-[var(--color-charcoal-900)] p-4 rounded-lg border border-[var(--color-charcoal-700)] text-center">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-500">Privacy Exposure</span>
                      <span className="text-lg text-[var(--color-accent-green)]">{verifiedPrivacy.exposureScore}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Metadata Tags</span>
                      <span className="text-sm text-[var(--color-accent-green)] font-medium">{verifiedMetadata.totalCount}</span>
                    </div>
                  </div>
                </div>

                {/* Verification Targets */}
                <div className="bg-[var(--color-charcoal-900)] border border-[var(--color-charcoal-700)] rounded-lg overflow-hidden">
                  <div className="p-3 border-b border-[var(--color-charcoal-700)] bg-[var(--color-charcoal-800)]">
                    <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Target Verification</h4>
                  </div>
                  <div className="divide-y divide-[var(--color-charcoal-700)]">
                    {verificationReport.targets.map((target, idx) => (
                      <div key={idx} className="p-3 grid grid-cols-4 items-center text-xs">
                        <span className="col-span-1 text-slate-300 font-medium">{target.category}</span>
                        <span className="col-span-1 text-slate-500 line-through decoration-slate-600">{target.before}</span>
                        <span className="col-span-1 text-slate-400">{target.after}</span>
                        <span className={`col-span-1 text-right font-mono font-bold ${
                          target.status === 'VERIFIED REMOVED' ? 'text-[var(--color-accent-green)]' :
                          target.status === 'NOT APPLICABLE' ? 'text-slate-500' :
                          target.status === 'PRESERVED' ? 'text-[var(--color-accent-amber)]' :
                          'text-[var(--color-accent-red)]'
                        }`}>{target.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Limitations Output */}
                {limitations.length > 0 && (
                  <div className="bg-[var(--color-charcoal-800)] p-3 border-l-2 border-[var(--color-accent-amber)] text-xs">
                    <p className="font-bold text-[var(--color-accent-amber)] uppercase tracking-widest mb-1 flex items-center">
                      <Info className="w-3 h-3 mr-1" /> Notes
                    </p>
                    <ul className="text-slate-300 space-y-1 list-disc list-inside">
                      {limitations.map((lim, i) => <li key={i}>{lim}</li>)}
                    </ul>
                  </div>
                )}

                {/* Action */}
                <div className="pt-2 pb-6 flex space-x-4">
                  <button
                    onClick={handleDownload}
                    className="flex-1 bg-[var(--color-accent-green)] hover:bg-[var(--color-accent-green)]/90 text-[var(--color-charcoal-900)] font-bold tracking-wide p-3 flex items-center justify-center space-x-2 transition-colors rounded-sm text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>DOWNLOAD IMAGE</span>
                  </button>
                  <button
                    onClick={async () => {
                      const { ExportService } = await import('../services/export.service');
                      const objectUrl = URL.createObjectURL(file);
                      await ExportService.exportPDF(file, objectUrl, verifiedMetadata, verifiedPrivacy, verificationReport);
                      URL.revokeObjectURL(objectUrl);
                    }}
                    className="flex-1 bg-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-600)] text-[var(--color-accent-cyan)] font-bold tracking-wide p-3 flex items-center justify-center space-x-2 transition-colors rounded-sm text-sm border border-[var(--color-accent-cyan)]/30"
                  >
                    <Download className="w-4 h-4" />
                    <span>EXPORT REPORT</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
