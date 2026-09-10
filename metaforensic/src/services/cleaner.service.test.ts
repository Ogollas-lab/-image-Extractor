import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CleanerService } from './cleaner.service';
import * as piexif from 'piexifjs';

// Mock piexif
vi.mock('piexifjs', () => ({
  load: vi.fn(),
  dump: vi.fn(),
  insert: vi.fn(),
  ExifIFD: { DateTimeOriginal: 36867, DateTimeDigitized: 36868 },
  ImageIFD: { DateTime: 306, Make: 271, Model: 272, Software: 305, Artist: 315, Copyright: 334 },
}));

// Mock URL methods
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock fetch for dataUrlToBlob
global.fetch = vi.fn(() =>
  Promise.resolve({
    blob: () => Promise.resolve(new Blob(['mock data'], { type: 'image/jpeg' })),
  } as any)
);

describe('CleanerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (piexif.load as any).mockReturnValue({
      '0th': {
        306: '2023:01:01 12:00:00', // DateTime
        271: 'Canon', // Make
        272: 'EOS R5', // Model
        305: 'Lightroom', // Software
        315: 'John Doe', // Artist
        334: 'Copyright 2023', // Copyright
      },
      Exif: {
        36867: '2023:01:01 12:00:00', // DateTimeOriginal
      },
      GPS: {
        1: 'N',
      },
      Interop: {},
      '1st': {},
    });
    (piexif.dump as any).mockReturnValue('mock-exif-string');
    (piexif.insert as any).mockReturnValue('data:image/jpeg;base64,mock');
  });

  it('falls back to canvas for non-JPEG files', async () => {
    const pngFile = new File(['dummy content'], 'test.png', { type: 'image/png' });
    
    // We expect cleanImage to attempt canvas creation, which might fail or resolve depending on jsdom canvas support.
    // To avoid actual canvas errors in vitest, we'll just spy on the private method or assert the limitations message.
    // Instead, let's mock cleanWithCanvas to test the router logic.
    const cleanWithCanvasSpy = vi.spyOn(CleanerService as any, 'cleanWithCanvas').mockResolvedValue({
      blob: new Blob(),
      objectUrl: 'blob:test',
      limitations: ['Selective removal is not supported for image/png. All metadata has been stripped instead.']
    });

    const result = await CleanerService.cleanImage(pngFile, { gps: true, timestamps: false, camera: false, author: false, all: false });
    
    expect(cleanWithCanvasSpy).toHaveBeenCalled();
    expect(result.limitations).toContain('Selective removal is not supported for image/png. All metadata has been stripped instead.');
  });

  it('deletes GPS data from JPEG if options.gps is true', async () => {
    const jpegFile = new File(['dummy jpeg'], 'test.jpg', { type: 'image/jpeg' });
    
    class MockFileReader {
      onload: any;
      onerror: any;
      readAsDataURL() {
        if (this.onload) this.onload({ target: { result: 'data:image/jpeg;base64,dummy' } });
      }
    }
    global.FileReader = MockFileReader as any;

    await CleanerService.cleanImage(jpegFile, { gps: true, timestamps: false, camera: false, author: false, all: false });

    // Ensure dump was called with modified object (GPS deleted)
    const dumpedObj = (piexif.dump as any).mock.calls[0][0];
    expect(dumpedObj.GPS).toEqual({});
    expect(dumpedObj['0th'][271]).toBe('Canon'); // Make should remain
  });

  it('deletes timestamps if options.timestamps is true', async () => {
    const jpegFile = new File(['dummy jpeg'], 'test.jpg', { type: 'image/jpeg' });
    await CleanerService.cleanImage(jpegFile, { gps: false, timestamps: true, camera: false, author: false, all: false });

    const dumpedObj = (piexif.dump as any).mock.calls[0][0];
    expect(dumpedObj.Exif[36867]).toBeUndefined(); // DateTimeOriginal gone
    expect(dumpedObj['0th'][306]).toBeUndefined(); // DateTime gone
    expect(dumpedObj.GPS[1]).toBe('N'); // GPS should remain
  });

  it('deletes camera info if options.camera is true', async () => {
    const jpegFile = new File(['dummy jpeg'], 'test.jpg', { type: 'image/jpeg' });
    await CleanerService.cleanImage(jpegFile, { gps: false, timestamps: false, camera: true, author: false, all: false });

    const dumpedObj = (piexif.dump as any).mock.calls[0][0];
    expect(dumpedObj['0th'][271]).toBeUndefined(); // Make gone
    expect(dumpedObj['0th'][272]).toBeUndefined(); // Model gone
    expect(dumpedObj['0th'][305]).toBeUndefined(); // Software gone
    expect(dumpedObj['0th'][315]).toBe('John Doe'); // Artist should remain
  });

  it('deletes author info if options.author is true', async () => {
    const jpegFile = new File(['dummy jpeg'], 'test.jpg', { type: 'image/jpeg' });
    await CleanerService.cleanImage(jpegFile, { gps: false, timestamps: false, camera: false, author: true, all: false });

    const dumpedObj = (piexif.dump as any).mock.calls[0][0];
    expect(dumpedObj['0th'][315]).toBeUndefined(); // Artist gone
    expect(dumpedObj['0th'][334]).toBeUndefined(); // Copyright gone
    expect(dumpedObj['0th'][271]).toBe('Canon'); // Make should remain
  });

  it('clears all specified IFDs if options.all is true', async () => {
    const jpegFile = new File(['dummy jpeg'], 'test.jpg', { type: 'image/jpeg' });
    await CleanerService.cleanImage(jpegFile, { gps: true, timestamps: true, camera: true, author: true, all: true });

    const dumpedObj = (piexif.dump as any).mock.calls[0][0];
    expect(dumpedObj['0th']).toEqual({});
    expect(dumpedObj.Exif).toEqual({});
    expect(dumpedObj.GPS).toEqual({});
    expect(dumpedObj.Interop).toEqual({});
  });
});
