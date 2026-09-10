import fs from 'fs';
import path from 'path';
import piexif from 'piexifjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceImagePath = 'C:\\Users\\HUAWEI\\.gemini\\antigravity-ide\\brain\\8ef2e0af-63d2-4879-bdca-d962bfcd3bff\\sample_cityscape_1788386550185.jpg';
const publicSamplesDir = path.join(__dirname, '../public/samples');

if (!fs.existsSync(publicSamplesDir)) {
  fs.mkdirSync(publicSamplesDir, { recursive: true });
}

const minimalPath = path.join(publicSamplesDir, 'sample_minimal.jpg');
const richPath = path.join(publicSamplesDir, 'sample_rich.jpg');

// 1. Create minimal (just copy the raw generated file, which has basically no EXIF)
fs.copyFileSync(sourceImagePath, minimalPath);

// 2. Create rich (inject EXIF)
const jpegData = fs.readFileSync(sourceImagePath);
const dataUrl = 'data:image/jpeg;base64,' + jpegData.toString('base64');

const zeroth = {};
const exif = {};
const gps = {};

zeroth[piexif.ImageIFD.Make] = "Apple";
zeroth[piexif.ImageIFD.Model] = "iPhone 14 Pro Max";
zeroth[piexif.ImageIFD.Software] = "iOS 17.1";
zeroth[piexif.ImageIFD.DateTime] = "2023:10:15 14:30:00";
zeroth[piexif.ImageIFD.Artist] = "Jane Doe";
zeroth[piexif.ImageIFD.Copyright] = "Jane Doe 2023";

exif[piexif.ExifIFD.DateTimeOriginal] = "2023:10:15 14:30:00";
exif[piexif.ExifIFD.LensMake] = "Apple";
exif[piexif.ExifIFD.LensModel] = "iPhone 14 Pro Max back triple camera 6.86mm f/1.78";
exif[piexif.ExifIFD.FNumber] = [178, 100];
exif[piexif.ExifIFD.ISOSpeedRatings] = 125;
exif[piexif.ExifIFD.ExposureTime] = [1, 100];
exif[piexif.ExifIFD.UserComment] = "Confidential project meeting location";

// New York Coordinates roughly
gps[piexif.GPSIFD.GPSLatitudeRef] = "N";
gps[piexif.GPSIFD.GPSLatitude] = [[40, 1], [42, 1], [4600, 100]]; // 40 deg 42' 46"
gps[piexif.GPSIFD.GPSLongitudeRef] = "W";
gps[piexif.GPSIFD.GPSLongitude] = [[74, 1], [0, 1], [2100, 100]]; // 74 deg 0' 21"
gps[piexif.GPSIFD.GPSAltitudeRef] = 0;
gps[piexif.GPSIFD.GPSAltitude] = [150, 1]; // 150m

const exifObj = { "0th": zeroth, "Exif": exif, "GPS": gps };
const exifBytes = piexif.dump(exifObj);

const newJpegDataUrl = piexif.insert(exifBytes, dataUrl);
const newJpegBase64 = newJpegDataUrl.split(',')[1];

fs.writeFileSync(richPath, Buffer.from(newJpegBase64, 'base64'));

console.log('Sample images created in public/samples/');
