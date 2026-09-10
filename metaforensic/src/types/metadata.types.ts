export interface FileInfo {
  name: string;
  size: number; // bytes
  type: string; // MIME type
  extension: string;
  lastModified: number;
  width?: number;
  height?: number;
}

export interface GPSData {
  latitude: number;
  longitude: number;
}

export interface CategorizedMetadata {
  [category: string]: Record<string, any>;
}

export interface ExtractedMetadata {
  fileInfo: FileInfo;
  exif: Record<string, any> | null;
  iptc: Record<string, any> | null;
  xmp: Record<string, any> | null;
  gps: GPSData | null;
  categorized: CategorizedMetadata;
  totalCount: number;
  dateTimeOriginal: string | null;
}

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface PrivacyFinding {
  type: string;
  severity: SeverityLevel;
  explanation: string;
  evidence: Array<{ key: string; value: string }>;
  recommendation: string;
}

export interface PrivacyReport {
  exposureScore: number; // 0 to 100, where 0 is highly private and 100 is highly exposed
  findings: PrivacyFinding[];
}

export type VerificationStatus = 
  | 'VERIFIED CLEAN' 
  | 'CLEAN WITH LIMITATIONS' 
  | 'PARTIALLY CLEAN' 
  | 'NOT CLEAN' 
  | 'VERIFICATION FAILED' 
  | 'UNSUPPORTED';

export type VerificationTargetStatus = 
  | 'VERIFIED REMOVED' 
  | 'PRESERVED' 
  | 'PARTIALLY REMOVED' 
  | 'UNVERIFIED' 
  | 'NOT APPLICABLE';

export interface VerificationTarget {
  category: string;
  before: string | 'Present';
  after: string | 'Not detected';
  status: VerificationTargetStatus;
}

export interface VerificationReport {
  originalHash: string;
  cleanedHash: string;
  status: VerificationStatus;
  targets: VerificationTarget[];
  limitations: string[];
}
