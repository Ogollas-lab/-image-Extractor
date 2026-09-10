import type { 
  ExtractedMetadata, 
  VerificationReport, 
  VerificationStatus, 
  VerificationTarget, 
  VerificationTargetStatus 
} from '../types/metadata.types';

export class VerificationService {
  /**
   * Independently verifies the cleaning operation by comparing the extracted metadata
   * of the original file against the extracted metadata of the cleaned file.
   */
  static verify(
    original: ExtractedMetadata, 
    cleaned: ExtractedMetadata, 
    originalHash: string, 
    cleanedHash: string,
    cleanLimitations: string[]
  ): VerificationReport {
    const targets: VerificationTarget[] = [];
    let isFullyCleaned = true;
    let isPartiallyCleaned = false;

    // Check GPS
    const gpsStatus = this.comparePresence(!!original.gps, !!cleaned.gps);
    targets.push({
      category: 'GPS / Location',
      before: original.gps ? 'Present' : 'Not detected',
      after: cleaned.gps ? 'Present' : 'Not detected',
      status: gpsStatus
    });

    // Check EXIF
    const exifStatus = this.comparePresence(!!original.exif, !!cleaned.exif);
    targets.push({
      category: 'EXIF Data',
      before: original.exif ? 'Present' : 'Not detected',
      after: cleaned.exif ? 'Present' : 'Not detected',
      status: exifStatus
    });

    // Check XMP
    const xmpStatus = this.comparePresence(!!original.xmp, !!cleaned.xmp);
    targets.push({
      category: 'XMP Data',
      before: original.xmp ? 'Present' : 'Not detected',
      after: cleaned.xmp ? 'Present' : 'Not detected',
      status: xmpStatus
    });

    // Check IPTC
    const iptcStatus = this.comparePresence(!!original.iptc, !!cleaned.iptc);
    targets.push({
      category: 'IPTC Data',
      before: original.iptc ? 'Present' : 'Not detected',
      after: cleaned.iptc ? 'Present' : 'Not detected',
      status: iptcStatus
    });

    // Aggregate status from targets
    for (const target of targets) {
      if (target.status === 'PARTIALLY REMOVED') {
        isPartiallyCleaned = true;
        isFullyCleaned = false;
      } else if (target.status === 'PRESERVED' && target.before === 'Present') {
        isFullyCleaned = false;
      } else if (target.status === 'VERIFIED REMOVED') {
        isPartiallyCleaned = true;
      }
    }

    // Determine high-level status based on format and actual results
    let finalStatus: VerificationStatus = 'VERIFICATION FAILED';
    const ext = original.fileInfo.extension.toLowerCase();
    const isJpeg = ext === 'jpg' || ext === 'jpeg';

    if (cleaned.totalCount > 0 && isFullyCleaned) {
      // If there's still metadata, but the main blocks we tracked above were removed?
      // Actually, if EXIF, XMP, IPTC, GPS are all 'Not detected' but totalCount > 0, it means
      // there is some other data.
      isFullyCleaned = false;
    }

    if (originalHash === cleanedHash) {
      finalStatus = 'VERIFICATION FAILED';
      cleanLimitations.push('The output file hash matches the original. The file was not modified.');
    } else if (isFullyCleaned && cleaned.totalCount === 0) {
      if (isJpeg) {
        finalStatus = 'VERIFIED CLEAN';
      } else {
        finalStatus = 'CLEAN WITH LIMITATIONS';
        cleanLimitations.push(`Full sanitization cannot be structurally guaranteed for ${ext.toUpperCase()} files without a specialized binary parser. A destructive canvas scrub was used.`);
      }
    } else if (isPartiallyCleaned && cleaned.totalCount > 0) {
      finalStatus = 'PARTIALLY CLEAN';
    } else if (!isPartiallyCleaned && cleaned.totalCount >= original.totalCount) {
      finalStatus = 'NOT CLEAN';
    } else {
      finalStatus = 'PARTIALLY CLEAN'; // Fallback
    }

    return {
      originalHash,
      cleanedHash,
      status: finalStatus,
      targets,
      limitations: cleanLimitations
    };
  }

  private static comparePresence(hadBefore: boolean, hasAfter: boolean): VerificationTargetStatus {
    if (hadBefore && !hasAfter) return 'VERIFIED REMOVED';
    if (hadBefore && hasAfter) return 'PRESERVED';
    if (!hadBefore && !hasAfter) return 'NOT APPLICABLE';
    if (!hadBefore && hasAfter) return 'UNVERIFIED'; // Odd case where data was ADDED
    return 'UNVERIFIED';
  }
}
