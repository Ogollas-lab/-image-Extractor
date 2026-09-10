import fs from 'fs';
import path from 'path';
import piexif from 'piexifjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const richPath = path.join(__dirname, '../public/samples/sample_rich.jpg');

try {
  const jpegData = fs.readFileSync(richPath);
  const dataUrl = 'data:image/jpeg;base64,' + jpegData.toString('base64');
  
  let exifObj = piexif.load(dataUrl);
  
  // Test "all" cleaning
  exifObj = {
    '0th': {},
    Exif: {},
    GPS: {},
    Interop: {},
    '1st': {},
    thumbnail: null,
  };
  
  const exifStr = piexif.dump(exifObj);
  const newJpegDataUrl = piexif.insert(exifStr, dataUrl);
  
  console.log('SUCCESS: piexif dump and insert worked.');
} catch (e) {
  console.error('ERROR during piexif operation:', e.message, e.stack);
}
