import { describe, it, expect } from 'vitest';
import { PrivacyService } from './privacy.service';
import type { ExtractedMetadata } from '../types/metadata.types';

const mockBaseMetadata: ExtractedMetadata = {
  fileInfo: { name: 'test.jpg', size: 1000, type: 'image/jpeg', extension: 'jpg', lastModified: 0 },
  exif: null,
  iptc: null,
  xmp: null,
  gps: null,
  categorized: {},
  totalCount: 0,
  dateTimeOriginal: null,
};

describe('PrivacyService', () => {
  it('returns exposureScore 0 with zero findings for empty metadata', () => {
    const report = PrivacyService.analyze(mockBaseMetadata);
    expect(report.exposureScore).toBe(0);
    expect(report.findings).toHaveLength(0);
  });

  it('detects GPS data (CRITICAL) and adds 40 points', () => {
    const md: ExtractedMetadata = {
      ...mockBaseMetadata,
      gps: { latitude: 10, longitude: 20 },
      categorized: {
        'Location': { latitude: 10, longitude: 20 }
      },
      totalCount: 1
    };
    const report = PrivacyService.analyze(md);
    expect(report.exposureScore).toBe(40);
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0].severity).toBe('CRITICAL');
    expect(report.findings[0].type).toContain('Location');
  });

  it('detects Serial Numbers (CRITICAL) and adds 40 points', () => {
    const md: ExtractedMetadata = {
      ...mockBaseMetadata,
      categorized: {
        'Camera': { SerialNumber: '12345ABC' }
      },
      totalCount: 1
    };
    const report = PrivacyService.analyze(md);
    expect(report.exposureScore).toBe(40);
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0].severity).toBe('CRITICAL');
    expect(report.findings[0].type).toContain('Serial Number');
  });

  it('detects Author/Copyright (HIGH) and adds 25 points', () => {
    const md: ExtractedMetadata = {
      ...mockBaseMetadata,
      categorized: {
        'Authorship': { Artist: 'John Doe' }
      },
      totalCount: 1
    };
    const report = PrivacyService.analyze(md);
    expect(report.exposureScore).toBe(25);
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0].severity).toBe('HIGH');
  });

  it('detects Exact Timestamps (MEDIUM) and adds 15 points', () => {
    const md: ExtractedMetadata = {
      ...mockBaseMetadata,
      dateTimeOriginal: '2023-10-01T12:00:00Z',
      categorized: {
        'Time': { DateTimeOriginal: '2023-10-01T12:00:00Z' }
      },
      totalCount: 1
    };
    const report = PrivacyService.analyze(md);
    expect(report.exposureScore).toBe(15);
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0].severity).toBe('MEDIUM');
  });

  it('detects Device Info (LOW) and adds 5 points', () => {
    const md: ExtractedMetadata = {
      ...mockBaseMetadata,
      categorized: {
        'Camera Info': { Make: 'Canon', Model: 'EOS R5' }
      },
      totalCount: 2
    };
    const report = PrivacyService.analyze(md);
    expect(report.exposureScore).toBe(5);
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0].severity).toBe('LOW');
  });

  it('calculates aggregate scores up to a maximum of 100', () => {
    const md: ExtractedMetadata = {
      ...mockBaseMetadata,
      gps: { latitude: 10, longitude: 20 }, // 40
      dateTimeOriginal: '2023-01-01', // 15
      categorized: {
        'Location': { latitude: 10, longitude: 20 },
        'Time': { DateTimeOriginal: '2023-01-01' },
        'Camera Info': { SerialNumber: 'XYZ', Make: 'Canon' }, // 40 + 5 = 45
        'Author': { Copyright: 'Me' } // 25
      },
      totalCount: 10
    };
    const report = PrivacyService.analyze(md);
    // 40 + 15 + 40 + 5 + 25 = 125 -> capped at 100
    expect(report.exposureScore).toBe(100);
    expect(report.findings.length).toBeGreaterThan(0);
  });
});
