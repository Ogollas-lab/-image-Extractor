export interface CleanOptions {
  gps: boolean;
  timestamps: boolean;
  camera: boolean;
  author: boolean;
  all: boolean;
}

export interface CleanResult {
  blob: Blob;
  objectUrl: string;
  limitations: string[];
}
