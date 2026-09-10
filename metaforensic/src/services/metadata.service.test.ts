import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MetadataService } from './metadata.service';
import exifr from 'exifr';

// We mock exifr to return deterministic values for testing categorization,
// as real EXIF binary generation inside unit tests is unstable without large fixtures.
vi.mock('exifr', () => ({
  default: {
    parse: vi.fn(),
  },
}));

// We also need to mock getImageDimensions because JSDOM Image doesn't load binary blobs well
vi.spyOn(MetadataService, 'getImageDimensions').mockImplementation(async () => {
  return { width: 800, height: 600 };
});

describe('MetadataService', () => {
  describe('extractMetadata', () => {
    beforeEach(() => {
      vi.resetAllMocks();
      vi.spyOn(MetadataService, 'getImageDimensions').mockResolvedValue({ width: 800, height: 600 });
    });

    it('processes a JPEG containing EXIF', async () => {
      const mockFile = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });

      vi.mocked(exifr.parse).mockImplementation(async (_file, options) => {
        if ((options as any)?.exif) {
          return {
            Make: 'Nikon',
            Model: 'D7000',
            latitude: 10,
            longitude: 20,
            ExifImageWidth: 1920,
            ExifImageHeight: 1080,
          };
        }
        return null;
      });

      const result = await MetadataService.extractMetadata(mockFile);
      expect(result.fileInfo.name).toBe('test.jpg');
      expect(result.fileInfo.width).toBe(1920); // Extracted from ExifImageWidth
      expect(result.gps).toEqual({ latitude: 10, longitude: 20 });
      expect(result.categorized['Camera Info']['Make']).toBe('Nikon');
    });

    it('processes a JPEG without EXIF', async () => {
      const mockFile = new File(['dummy'], 'noexif.jpg', { type: 'image/jpeg' });
      vi.mocked(exifr.parse).mockResolvedValue(undefined); // No EXIF found

      const result = await MetadataService.extractMetadata(mockFile);
      expect(result.fileInfo.name).toBe('noexif.jpg');
      expect(result.exif).toBeNull();
      expect(result.gps).toBeNull();
      // Should fallback to getImageDimensions which we mocked to 800x600
      expect(result.fileInfo.width).toBe(800);
    });

    it('handles a PNG image with XMP', async () => {
      const mockFile = new File(['dummy'], 'image.png', { type: 'image/png' });
      vi.mocked(exifr.parse).mockImplementation(async (_file, options) => {
        if ((options as any)?.xmp) {
          return { 'xmp:CreatorTool': 'Adobe Photoshop' };
        }
        return null;
      });

      const result = await MetadataService.extractMetadata(mockFile);
      expect(result.fileInfo.extension).toBe('png');
      expect(result.xmp).toEqual({ 'xmp:CreatorTool': 'Adobe Photoshop' });
      expect(result.categorized['XMP']['xmp:CreatorTool']).toBe('Adobe Photoshop');
    });

    it('detects a corrupted image gracefully', async () => {
      const mockFile = new File(['bad'], 'corrupt.jpg', { type: 'image/jpeg' });
      vi.mocked(exifr.parse).mockRejectedValue(new Error('Corrupted EXIF'));

      // Also mock getImageDimensions to fail to simulate total corruption
      vi.spyOn(MetadataService, 'getImageDimensions').mockResolvedValueOnce(null);

      const result = await MetadataService.extractMetadata(mockFile);
      expect(result.exif).toBeNull();
      expect(result.fileInfo.width).toBeUndefined();
    });
  });
});
