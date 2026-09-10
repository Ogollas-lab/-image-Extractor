/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useState, useContext, type ReactNode } from 'react';
import type { ExtractedMetadata } from '../types/metadata.types';

interface FileState {
  file: File | null;
  objectUrl: string | null;
  metadata: ExtractedMetadata | null;
  isProcessing: boolean;
  error: string | null;
}

interface FileContextType extends FileState {
  setFile: (file: File) => void;
  setMetadata: (metadata: ExtractedMetadata | null) => void;
  clearFile: () => void;
  setError: (error: string) => void;
  setProcessing: (isProcessing: boolean) => void;
}

const initialState: FileState = {
  file: null,
  objectUrl: null,
  metadata: null,
  isProcessing: false,
  error: null,
};

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FileState>(initialState);

  const setFile = (file: File) => {
    // Revoke old URL to avoid memory leaks
    if (state.objectUrl) {
      URL.revokeObjectURL(state.objectUrl);
    }

    setState({
      ...initialState,
      file,
      objectUrl: URL.createObjectURL(file),
    });
  };

  const setMetadata = (metadata: ExtractedMetadata | null) => {
    setState((prev) => ({ ...prev, metadata }));
  };

  const clearFile = () => {
    if (state.objectUrl) {
      URL.revokeObjectURL(state.objectUrl);
    }
    setState(initialState);
  };

  const setError = (error: string) => {
    setState((prev) => ({ ...prev, error, isProcessing: false }));
  };

  const setProcessing = (isProcessing: boolean) => {
    setState((prev) => ({ ...prev, isProcessing }));
  };

  return (
    <FileContext.Provider
      value={{ ...state, setFile, setMetadata, clearFile, setError, setProcessing }}
    >
      {children}
    </FileContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFile() {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFile must be used within a FileProvider');
  }
  return context;
}
