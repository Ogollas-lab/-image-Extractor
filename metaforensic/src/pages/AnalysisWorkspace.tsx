import { useState, useEffect, useMemo } from 'react';
import { useFile } from '../context/FileContext';
import { useNavigate } from '@tanstack/react-router';
import { MetadataTable } from '../components/ui/MetadataTable';
import { MapPin, FileImage, Clock, Hash, AlertTriangle } from 'lucide-react';
import { PrivacyService } from '../services/privacy.service';

export function AnalysisWorkspace() {
  const { file, objectUrl, metadata } = useFile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    if (!file || !metadata) {
      navigate({ to: '/' });
    }
  }, [file, metadata, navigate]);

  const allMetadataFlattened = useMemo(() => {
    if (!metadata) return {};
    let all: Record<string, any> = {};
    for (const cat of Object.values(metadata.categorized)) {
      all = { ...all, ...cat };
    }
    return all;
  }, [metadata]);

  if (!file || !objectUrl || !metadata) return null;

  const tabs = [
    'Overview',
    'Camera Info',
    'Image Settings',
    'Location & Time',
    'Software & Authorship',
    'IPTC',
    'XMP',
    'Other',
    'All Metadata',
  ];

  // Calculate privacy insights for the overview
  const privacy = PrivacyService.analyze(metadata);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] -m-6 border-t border-[var(--color-charcoal-700)]">
      {/* Sidebar - Horizontal on mobile, vertical on desktop */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[var(--color-charcoal-700)] bg-[var(--color-charcoal-800)] p-4 md:p-6 overflow-x-auto md:overflow-y-auto shrink-0 z-10">
        <h3 className="hidden md:block text-xs font-semibold tracking-widest text-slate-500 mb-6 uppercase">
          Analysis Views
        </h3>
        <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-1">
          {tabs.map((tab) => {
            // Only show tabs that have data, except Overview and All Metadata
            if (tab !== 'Overview' && tab !== 'All Metadata' && !metadata.categorized[tab]) {
              return null;
            }
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap md:whitespace-normal text-left px-3 py-2 rounded-sm text-sm transition-colors ${
                  activeTab === tab
                    ? 'bg-[var(--color-charcoal-600)] text-slate-200 font-medium'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-[var(--color-charcoal-700)]'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[var(--color-charcoal-900)] relative">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-lg font-medium mb-6 tracking-wide text-slate-300 uppercase border-b border-[var(--color-charcoal-700)] pb-2 flex items-center justify-between">
            <span>{activeTab}</span>
            {activeTab === 'All Metadata' && (
              <span className="text-xs font-mono text-[var(--color-accent-cyan)]">{metadata.totalCount} Tags</span>
            )}
          </h2>

          {activeTab === 'Overview' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Image Preview & Core Info */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Image Card */}
                <div className="panel p-4 flex flex-col items-center justify-center lg:w-1/3 shrink-0 bg-[var(--color-charcoal-800)]">
                  <div className="w-full aspect-square bg-[var(--color-charcoal-900)] border border-[var(--color-charcoal-700)] rounded flex items-center justify-center overflow-hidden mb-4 relative group">
                    {/* Checkered background for transparent images (PNG/WEBP) */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMmQzNzQ4Ii8+PHJlY3QgeD0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzFhMjAyYyIvPjxyZWN0IHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxYTIwMmMiLz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzJkMzc0OCIvPjwvc3ZnPg==')] opacity-30 z-0"></div>
                    <img
                      src={objectUrl}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain relative z-10 drop-shadow-xl"
                    />
                  </div>
                  <h3 className="font-mono text-sm text-center break-all w-full text-slate-300">{metadata.fileInfo.name}</h3>
                </div>

                {/* Stats Grid */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="panel p-4 flex flex-col">
                    <div className="flex items-center text-slate-400 mb-2">
                      <FileImage className="w-4 h-4 mr-2" />
                      <span className="text-xs uppercase tracking-widest font-semibold">Format & Size</span>
                    </div>
                    <p className="font-mono text-lg text-slate-200 mt-auto">
                      {metadata.fileInfo.type.split('/')[1].toUpperCase()}
                    </p>
                    <p className="text-sm text-[var(--color-accent-cyan)] font-mono">
                      {(metadata.fileInfo.size / (1024 * 1024)).toFixed(2)} MB
                      {metadata.fileInfo.width && ` • ${metadata.fileInfo.width}×${metadata.fileInfo.height}px`}
                    </p>
                  </div>

                  <div className="panel p-4 flex flex-col">
                    <div className="flex items-center text-slate-400 mb-2">
                      <Hash className="w-4 h-4 mr-2" />
                      <span className="text-xs uppercase tracking-widest font-semibold">Extracted Tags</span>
                    </div>
                    <p className="font-mono text-3xl text-[var(--color-accent-green)] mt-auto">
                      {metadata.totalCount}
                    </p>
                  </div>

                  <div className="panel p-4 flex flex-col">
                    <div className="flex items-center text-slate-400 mb-2">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="text-xs uppercase tracking-widest font-semibold">Captured Date</span>
                    </div>
                    <p className="font-mono text-sm text-slate-200 mt-auto break-words">
                      {metadata.dateTimeOriginal || 'Not found'}
                    </p>
                  </div>

                  <div className="panel p-4 flex flex-col">
                    <div className="flex items-center text-slate-400 mb-2">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-xs uppercase tracking-widest font-semibold">GPS Location</span>
                    </div>
                    {metadata.gps ? (
                      <div className="mt-auto">
                        <p className="font-mono text-sm text-[var(--color-accent-red)]">
                          {metadata.gps.latitude.toFixed(6)}, {metadata.gps.longitude.toFixed(6)}
                        </p>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${metadata.gps.latitude},${metadata.gps.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[var(--color-accent-cyan)] hover:underline mt-1 inline-block"
                        >
                          View on Google Maps ↗
                        </a>
                      </div>
                    ) : (
                      <p className="font-mono text-sm text-slate-500 mt-auto">No GPS Data</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Privacy Warning */}
              {privacy.findings.length > 0 && (
                <div className="panel p-6 border-[var(--color-accent-red)]/30 bg-[var(--color-accent-red)]/5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-accent-red)]"></div>
                  <div className="flex items-start">
                    <AlertTriangle className="w-6 h-6 text-[var(--color-accent-red)] mr-3 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-[var(--color-accent-red)] mb-2 uppercase tracking-wide">
                        Privacy Risks Detected
                      </h4>
                      <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                        {privacy.findings.map((finding, i) => (
                          <li key={i}>{finding.type}</li>
                        ))}
                      </ul>
                      <p className="text-xs text-slate-400 mt-4">
                        Consider using the Cleaner tool before sharing this file publicly.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'All Metadata' ? (
            <MetadataTable data={allMetadataFlattened} title="All Metadata" />
          ) : (
            <MetadataTable data={metadata.categorized[activeTab] || {}} title={activeTab} />
          )}
        </div>
      </main>
    </div>
  );
}
