import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useFile } from '../context/FileContext';
import { ImageUploader } from '../components/ImageUploader';
import { MetadataService } from '../services/metadata.service';

export function Index() {
  const { setFile, setMetadata } = useFile();
  const navigate = useNavigate();
  const [loadingSample, setLoadingSample] = React.useState<string | null>(null);

  const loadSample = async (type: 'rich' | 'minimal') => {
    setLoadingSample(type);
    try {
      const url = type === 'rich' ? '/samples/sample_rich.jpg' : '/samples/sample_minimal.jpg';
      const filename = type === 'rich' ? 'metadata_rich_sample.jpg' : 'metadata_minimal_sample.jpg';
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: 'image/jpeg' });
      
      setFile(file);
      const extracted = await MetadataService.extractMetadata(file);
      setMetadata(extracted);
      
      navigate({ to: '/analysis' });
    } catch (err: any) {
      console.error('Failed to load sample image', err);
      alert(`Failed to load sample image: ${err.message}`);
    } finally {
      setLoadingSample(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-20 flex flex-col items-center text-center">
      <h1 className="text-3xl font-light tracking-tight mb-2">Image Metadata & Privacy Analyzer</h1>
      <p className="text-slate-400 text-sm mb-12">
        Your image is processed securely in your browser.
      </p>
      <ImageUploader />

      <div className="mt-12 space-y-4">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
          Don't have an image? Try a sample:
        </p>
        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={() => loadSample('rich')}
            disabled={loadingSample !== null}
            className="text-sm text-[var(--color-accent-cyan)] hover:text-white transition-colors disabled:opacity-50 border border-[var(--color-accent-cyan)]/30 bg-[var(--color-accent-cyan)]/10 px-4 py-2 rounded-sm"
          >
            {loadingSample === 'rich' ? 'Loading...' : "Full Metadata (GPS & EXIF)"}
          </button>
          
          <button
            onClick={() => loadSample('minimal')}
            disabled={loadingSample !== null}
            className="text-sm text-slate-300 hover:text-white transition-colors disabled:opacity-50 border border-slate-600 bg-slate-800/50 px-4 py-2 rounded-sm"
          >
            {loadingSample === 'minimal' ? 'Loading...' : "Minimal Metadata"}
          </button>
        </div>
      </div>
    </div>
  );
}
