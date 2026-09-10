import React, { useCallback, useState } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';
import { useFile } from '../context/FileContext';
import { useNavigate } from '@tanstack/react-router';
import { MetadataService } from '../services/metadata.service';
import { env } from '../config/env';

const MAX_FILE_SIZE = env.MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/tiff', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'tiff', 'tif', 'webp'];

export function ImageUploader() {
  const { setFile, setMetadata, setError, error, setProcessing, isProcessing } = useFile();
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);

  const validateAndProcessFile = useCallback(
    async (file: File) => {
      setError('');
      setProcessing(true);

      try {
        // 1. File Type Validation
        if (!ALLOWED_TYPES.includes(file.type)) {
          throw new Error('Invalid file type. Please upload a JPG, PNG, TIFF, or WEBP image.');
        }

        // 2. Extension Validation
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          throw new Error('Invalid file extension.');
        }

        // 3. Size Validation
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(
            `File size exceeds ${env.MAX_FILE_SIZE_MB}MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(1)}MB.`,
          );
        }

        // 4. Set the file in context before extraction so preview can begin loading if needed
        setFile(file);

        // 5. Extraction (which includes corrupt-image detection)
        const extracted = await MetadataService.extractMetadata(file);

        // 6. Corrupt Image Check (if width/height are undefined, it means both EXIF and native Image failed to decode it)
        if (extracted.fileInfo.width === undefined || extracted.fileInfo.height === undefined) {
          throw new Error('The image file appears to be corrupted or cannot be decoded.');
        }

        setMetadata(extracted);
        navigate({ to: '/analysis' });
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred while processing the file.');
      } finally {
        setProcessing(false);
      }
    },
    [setError, setFile, setMetadata, setProcessing, navigate],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        validateAndProcessFile(e.dataTransfer.files[0]);
        e.dataTransfer.clearData();
      }
    },
    [validateAndProcessFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div
        className={`panel w-full p-12 border border-dashed transition-colors group relative cursor-pointer
          ${isDragging ? 'border-[var(--color-accent-cyan)] bg-[var(--color-charcoal-700)]' : 'border-[var(--color-charcoal-600)] hover:bg-[var(--color-charcoal-700)]'}
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={0}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".jpg,.jpeg,.png,.tiff,.tif,.webp,image/jpeg,image/png,image/tiff,image/webp"
          onChange={handleFileInput}
          title="Upload image"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center pointer-events-none">
          <UploadCloud
            className={`w-10 h-10 mb-4 transition-colors ${isDragging ? 'text-[var(--color-accent-cyan)]' : 'text-slate-500 group-hover:text-slate-300'} ${isProcessing ? 'animate-pulse text-[var(--color-accent-cyan)]' : ''}`}
          />
          <span className="text-sm font-medium">
            {isProcessing ? 'Processing image...' : 'Drag an image here or choose a file'}
          </span>
          <span className="text-xs text-slate-500 mt-2 font-mono">
            JPG • PNG • TIFF • WEBP (Max {env.MAX_FILE_SIZE_MB}MB)
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-6 w-full p-4 border border-[var(--color-accent-red)]/30 bg-[var(--color-accent-red)]/10 text-red-200 flex items-start space-x-3 rounded-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-[var(--color-accent-red)]" />
          <div className="text-sm">
            <p className="font-semibold text-[var(--color-accent-red)] mb-1">UPLOAD FAILED</p>
            <p>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
