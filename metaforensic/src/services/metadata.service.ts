import exifr from 'exifr';
import type {
  ExtractedMetadata,
  GPSData,
  CategorizedMetadata,
  FileInfo,
} from '../types/metadata.types';

export class MetadataService {
  /**
   * Reads image dimensions using the browser's native Image object.
   * Useful as a fallback if dimensions are missing from EXIF data.
   */
  static async getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || typeof Image === 'undefined') {
        resolve(null);
        return;
      }
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(objectUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      img.src = objectUrl;
    });
  }

  static async extractMetadata(file: File): Promise<ExtractedMetadata> {
    const fileInfo: FileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      extension: file.name.split('.').pop()?.toLowerCase() || '',
      lastModified: file.lastModified,
    };

    let rawExif: any = null;
    let rawIptc: any = null;
    let rawXmp: any = null;
    let gps: GPSData | null = null;

    // We attempt parsing for everything exifr supports.
    try {
      // First, get standard EXIF, TIFF, and GPS
      rawExif = await exifr.parse(file, {
        tiff: true,
        exif: true,
        gps: true,
        mergeOutput: false, // Keep blocks separate if possible (exifr still often merges unless specific)
      });

      // Explicitly extract IPTC
      rawIptc = await exifr.parse(file, { iptc: true });

      // Explicitly extract XMP
      rawXmp = await exifr.parse(file, { xmp: true });
    } catch (error) {
      // If exifr completely fails, it might be corrupt or unsupported.
      // We still return what we can (file info).
      console.warn('exifr parsing failed or found no metadata:', error);
    }

    // Attempt to parse GPS manually if exifr gps:true returned location
    if (rawExif && rawExif.latitude !== undefined && rawExif.longitude !== undefined) {
      gps = {
        latitude: rawExif.latitude,
        longitude: rawExif.longitude,
      };
    }

    // Fallback for dimensions
    if (rawExif && rawExif.ExifImageWidth && rawExif.ExifImageHeight) {
      fileInfo.width = rawExif.ExifImageWidth;
      fileInfo.height = rawExif.ExifImageHeight;
    } else {
      const dimensions = await this.getImageDimensions(file);
      if (dimensions) {
        fileInfo.width = dimensions.width;
        fileInfo.height = dimensions.height;
      }
    }

    const { categorized, totalCount, dateTimeOriginal } = this.categorizeAndCount(
      rawExif,
      rawIptc,
      rawXmp,
    );

    return {
      fileInfo,
      exif: rawExif || null,
      iptc: rawIptc || null,
      xmp: rawXmp || null,
      gps,
      categorized,
      totalCount,
      dateTimeOriginal,
    };
  }

  private static categorizeAndCount(
    exif: any,
    iptc: any,
    xmp: any,
  ): { categorized: CategorizedMetadata; totalCount: number; dateTimeOriginal: string | null } {
    const categorized: CategorizedMetadata = {
      'Camera Info': {},
      'Image Settings': {},
      'Location & Time': {},
      'Software & Authorship': {},
      IPTC: {},
      XMP: {},
      Other: {},
    };

    let totalCount = 0;
    let dateTimeOriginal: string | null = null;

    if (exif) {
      for (const [key, value] of Object.entries(exif)) {
        if (value === undefined || value === null) continue;

        // Skip some internal buffers Exifr leaves behind if any
        if (value instanceof Uint8Array || value instanceof ArrayBuffer) continue;

        totalCount++;

        const lowerKey = key.toLowerCase();

        if (lowerKey.includes('make') || lowerKey.includes('model') || lowerKey.includes('lens')) {
          categorized['Camera Info'][key] = value;
        } else if (
          lowerKey.includes('exposure') ||
          lowerKey.includes('fnumber') ||
          lowerKey.includes('iso') ||
          lowerKey.includes('focal') ||
          lowerKey.includes('flash') ||
          lowerKey.includes('whitebalance')
        ) {
          categorized['Image Settings'][key] = value;
        } else if (
          lowerKey.includes('gps') ||
          lowerKey.includes('latitude') ||
          lowerKey.includes('longitude') ||
          lowerKey.includes('date') ||
          lowerKey.includes('time')
        ) {
          categorized['Location & Time'][key] = value;

          if (key === 'DateTimeOriginal' || key === 'CreateDate') {
            dateTimeOriginal = String(value);
          }
        } else if (
          lowerKey.includes('software') ||
          lowerKey.includes('artist') ||
          lowerKey.includes('copyright')
        ) {
          categorized['Software & Authorship'][key] = value;
        } else {
          categorized['Other'][key] = value;
        }
      }
    }

    if (iptc) {
      for (const [key, value] of Object.entries(iptc)) {
        if (value === undefined || value === null || value instanceof Uint8Array) continue;
        totalCount++;
        categorized['IPTC'][key] = value;
      }
    }

    if (xmp) {
      for (const [key, value] of Object.entries(xmp)) {
        if (value === undefined || value === null || value instanceof Uint8Array) continue;
        totalCount++;
        categorized['XMP'][key] = value;
      }
    }

    // Clean up empty categories
    for (const category in categorized) {
      if (Object.keys(categorized[category]).length === 0) {
        delete categorized[category];
      }
    }

    return { categorized, totalCount, dateTimeOriginal };
  }
}
