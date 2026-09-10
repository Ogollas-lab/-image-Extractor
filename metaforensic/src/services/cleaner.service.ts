import * as piexif from 'piexifjs';
import type { CleanOptions, CleanResult } from '../types/cleaner.types';

export class CleanerService {
  /**
   * Cleans an image based on the provided options.
   * JPEGs are cleaned selectively using piexifjs.
   * Non-JPEGs are fully stripped using HTMLCanvasElement fallback due to format limitations.
   */
  static async cleanImage(file: File, options: CleanOptions): Promise<CleanResult> {
    const limitations: string[] = [];

    // Fallback for non-JPEG formats (Canvas stripping)
    if (file.type !== 'image/jpeg') {
      if (!options.all) {
        limitations.push(
          `Selective removal is not supported for ${file.type}. All metadata has been stripped instead.`
        );
      }
      return this.cleanWithCanvas(file, limitations);
    }

    // JPEG specific logic using piexifjs
    try {
      const dataUrl = await this.fileToDataUrl(file);
      
      // If piexif throws on load (e.g., no exif segment at all), it means it's already clean or corrupted EXIF structure.
      let exifObj;
      try {
        exifObj = piexif.load(dataUrl);
      } catch (_e) {
        // If we can't parse EXIF but it's a JPEG, fallback to canvas to be safe if they wanted it cleaned
        limitations.push('Failed to parse EXIF structure cleanly. Falling back to full canvas scrub.');
        return this.cleanWithCanvas(file, limitations);
      }

      if (options.all) {
        exifObj = {
          '0th': {},
          Exif: {},
          GPS: {},
          Interop: {},
          '1st': {},
          thumbnail: undefined,
        };
      } else {
        if (options.gps) {
          exifObj['GPS'] = {};
        }
        
        if (options.timestamps) {
          if (exifObj['Exif']) {
            delete exifObj['Exif'][piexif.ExifIFD.DateTimeOriginal];
            delete exifObj['Exif'][piexif.ExifIFD.DateTimeDigitized];
          }
          if (exifObj['0th']) {
            delete exifObj['0th'][piexif.ImageIFD.DateTime];
          }
        }
        
        if (options.camera && exifObj['0th']) {
          delete exifObj['0th'][piexif.ImageIFD.Make];
          delete exifObj['0th'][piexif.ImageIFD.Model];
          delete exifObj['0th'][piexif.ImageIFD.Software];
        }
        
        if (options.author && exifObj['0th']) {
          delete exifObj['0th'][piexif.ImageIFD.Artist];
          delete exifObj['0th'][piexif.ImageIFD.Copyright];
        }
      }

      const exifStr = piexif.dump(exifObj);
      const newJpegDataUrl = piexif.insert(exifStr, dataUrl);
      
      const blob = await this.dataUrlToBlob(newJpegDataUrl);
      return {
        blob,
        objectUrl: URL.createObjectURL(blob),
        limitations,
      };

    } catch (err: any) {
      throw new Error(`Failed to clean JPEG: ${err.message}`);
    }
  }

  private static async cleanWithCanvas(file: File, limitations: string[]): Promise<CleanResult> {
    const objectUrl = URL.createObjectURL(file);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Could not initialize canvas context.');

          ctx.drawImage(img, 0, 0);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas toBlob failed.'));
                return;
              }
              const newUrl = URL.createObjectURL(blob);
              resolve({
                blob,
                objectUrl: newUrl,
                limitations,
              });
            },
            file.type, // Maintain original MIME type if possible
            1.0 // Quality
          );
        } catch (e: any) {
          reject(new Error(`Canvas cleaning failed: ${e.message}`));
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image for canvas scrubbing.'));
      };
      img.src = objectUrl;
    });
  }

  private static fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  private static async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl);
    return res.blob();
  }
}
