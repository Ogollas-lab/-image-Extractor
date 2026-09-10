import type { ExtractedMetadata, PrivacyFinding, PrivacyReport } from '../types/metadata.types';

export class PrivacyService {
  static analyze(metadata: ExtractedMetadata | null): PrivacyReport {
    if (!metadata) {
      return { exposureScore: 0, findings: [] };
    }

    const findings: PrivacyFinding[] = [];
    
    // 1. GPS / Location (CRITICAL)
    if (metadata.gps) {
      const evidence = [];
      if (metadata.categorized['Location & Time']?.latitude) {
        evidence.push({ key: 'latitude', value: String(metadata.categorized['Location & Time'].latitude) });
      }
      if (metadata.categorized['Location & Time']?.longitude) {
        evidence.push({ key: 'longitude', value: String(metadata.categorized['Location & Time'].longitude) });
      }
      if (metadata.categorized['Location & Time']?.GPSAltitude) {
        evidence.push({ key: 'GPSAltitude', value: String(metadata.categorized['Location & Time'].GPSAltitude) });
      }

      // If we couldn't find the exact tags but GPS exists in the normalized model
      if (evidence.length === 0) {
        evidence.push({ key: 'GPS', value: `${metadata.gps.latitude}, ${metadata.gps.longitude}` });
      }

      findings.push({
        type: 'GPS Location Data',
        severity: 'CRITICAL',
        explanation: 'Precise geographic coordinates are embedded in this image. This can reveal your exact physical location at the time the photo was taken.',
        evidence,
        recommendation: 'Strip all GPS and location tags before sharing publicly.',
      });
    }

    // Prepare a flattened metadata object for easier rule matching
    let allData: Record<string, any> = {};
    for (const cat of Object.values(metadata.categorized)) {
      allData = { ...allData, ...cat };
    }

    // 2. Serial Numbers (CRITICAL)
    const serialEvidence = [];
    for (const [key, value] of Object.entries(allData)) {
      if (key.toLowerCase().includes('serialnumber') || key.toLowerCase().includes('internalvibrationserialnumber')) {
        serialEvidence.push({ key, value: String(value) });
      }
    }
    if (serialEvidence.length > 0) {
      findings.push({
        type: 'Hardware Serial Numbers',
        severity: 'CRITICAL',
        explanation: 'Hardware serial numbers are unique identifiers that can permanently link an image to a specific physical device you own.',
        evidence: serialEvidence.slice(0, 3), // max 3
        recommendation: 'Remove serial numbers to prevent device fingerprinting and correlation across different uploads.',
      });
    }

    // 3. Author & Copyright (HIGH)
    const authorEvidence = [];
    const authorKeys = ['artist', 'copyright', 'ownername', 'by-line', 'creator', 'credit', 'contact'];
    for (const [key, value] of Object.entries(allData)) {
      if (authorKeys.some(ak => key.toLowerCase().includes(ak))) {
        authorEvidence.push({ key, value: String(value) });
      }
    }
    if (authorEvidence.length > 0) {
      findings.push({
        type: 'Authorship & Copyright Info',
        severity: 'HIGH',
        explanation: 'The metadata contains explicit author, copyright, or contact information which can directly identify you.',
        evidence: authorEvidence.slice(0, 3),
        recommendation: 'If anonymity is required, remove authorship fields.',
      });
    }

    // 4. Personal Comments (HIGH)
    const commentEvidence = [];
    if (allData['UserComment']) {
      commentEvidence.push({ key: 'UserComment', value: String(allData['UserComment']) });
    }
    if (commentEvidence.length > 0) {
      findings.push({
        type: 'Personal Comments',
        severity: 'HIGH',
        explanation: 'User-defined comments can contain arbitrary personal notes or application-specific tracking data.',
        evidence: commentEvidence,
        recommendation: 'Clear user comments as they are often overlooked but highly sensitive.',
      });
    }

    // 5. Timestamps (MEDIUM)
    const timeEvidence = [];
    if (metadata.dateTimeOriginal) {
      timeEvidence.push({ key: 'DateTimeOriginal', value: metadata.dateTimeOriginal });
    } else {
      for (const [key, value] of Object.entries(allData)) {
        if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
          timeEvidence.push({ key, value: String(value) });
          break; // just get one representative time
        }
      }
    }
    if (timeEvidence.length > 0) {
      findings.push({
        type: 'Capture Timestamp',
        severity: 'MEDIUM',
        explanation: 'Exact timestamps reveal exactly when a photo was taken, allowing adversaries to build a pattern of life or timeline of events.',
        evidence: timeEvidence,
        recommendation: 'Remove timestamps, or shift them to a generic date, if exact chronology is sensitive.',
      });
    }

    // 6. Software (MEDIUM)
    const softwareEvidence = [];
    if (allData['Software']) softwareEvidence.push({ key: 'Software', value: String(allData['Software']) });
    if (allData['CreatorTool']) softwareEvidence.push({ key: 'CreatorTool', value: String(allData['CreatorTool']) });
    if (softwareEvidence.length > 0) {
      findings.push({
        type: 'Software Fingerprint',
        severity: 'MEDIUM',
        explanation: 'Identifies the software or OS used to process the image, potentially revealing the specific applications you use.',
        evidence: softwareEvidence,
        recommendation: 'Remove software tags to normalize the image profile.',
      });
    }

    // 7. Device / Camera Info (LOW)
    const deviceEvidence = [];
    const deviceKeys = ['make', 'model', 'lensmake', 'lensmodel'];
    for (const [key, value] of Object.entries(allData)) {
      if (deviceKeys.some(dk => key.toLowerCase() === dk)) {
        deviceEvidence.push({ key, value: String(value) });
      }
    }
    if (deviceEvidence.length > 0) {
      findings.push({
        type: 'Device Information',
        severity: 'LOW',
        explanation: 'Shows the specific hardware used to create the image.',
        evidence: deviceEvidence,
        recommendation: 'Remove camera and device metadata.',
      });
    }

    // Calculate Exposure Score (0 = perfect privacy, 100 = highly exposed)
    let exposureScore = 0;
    
    for (const finding of findings) {
      switch (finding.severity) {
        case 'CRITICAL':
          exposureScore += 40;
          break;
        case 'HIGH':
          exposureScore += 25;
          break;
        case 'MEDIUM':
          exposureScore += 15;
          break;
        case 'LOW':
          exposureScore += 5;
          break;
      }
    }

    // Cap the score at 100
    exposureScore = Math.min(exposureScore, 100);

    return {
      exposureScore,
      findings
    };
  }
}
