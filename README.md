A privacy-focused, browser-based image metadata extractor, analyzer, and cleaner. 

Metaforensic allows you to inspect the hidden metadata within your images, understand the privacy implications of that data, and strip sensitive information before sharing images online. **Everything happens 100% in your browser**—your files are never uploaded to any server.

## Features

- 🔍 **Deep Metadata Extraction:** Reads EXIF, IPTC, XMP, and GPS data from various image formats.
- 🛡️ **Privacy Analysis:** Automatically scans metadata for sensitive information (like GPS coordinates, camera serial numbers, and exact timestamps) and provides an exposure score.
- 🧹 **Selective Cleaning:** Strip out all metadata, or selectively remove just GPS data, timestamps, or authorship details (JPEG only). Non-JPEGs are fully scrubbed for safety.
- 📊 **Verification & Export:** Generate forensic PDFs and CSVs detailing the extracted metadata and verifying the sanitation process.
- 🔒 **Zero-Server Architecture:** 100% client-side processing using Web APIs, `exifr`, and `piexifjs`. Your data never leaves your device.

## Architecture & Tech Stack

This project is a Single Page Application (SPA) built for performance and modern static hosting.

- **Framework:** React 19
- **Bundler:** Vite 8
- **Routing:** TanStack Router
- **Styling:** Tailwind CSS 4
- **Testing:** Vitest + React Testing Library
- **Linting & Formatting:** Oxlint + Prettier
- **Core Processing Libs:** `exifr`, `piexifjs`, `jspdf`, `jspdf-autotable`

### Directory Structure

- `src/components/ui/`: Reusable, generic UI primitives (Button, Card, Alert).
- `src/components/layout/`: Application layout components (AppLayout, Header).
- `src/components/features/`: Domain-specific components (ImageUploader).
- `src/context/`: Global React Context providers (FileContext).
- `src/pages/`: Top-level route views.
- `src/services/`: Core logic and domain services (MetadataService, CleanerService, PrivacyService, ExportService).
- `src/hooks/`: Custom React Hooks.
- `src/utils/`: Helper functions.

## Development Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start the Development Server:**
   ```bash
   npm run dev
   ```

3. **Format & Lint:**
   ```bash
   npm run format
   npm run lint
   ```

4. **Run Tests:**
   ```bash
   npm run test
   ```

## Production Deployment (Vercel)

This project is optimized for direct static deployment to Vercel. 

1. Push your repository to GitHub.
2. Import the repository in Vercel.
3. Vercel will auto-detect the **Vite** framework.
4. Leave the default build command (`npm run build`) and output directory (`dist`).
5. A `vercel.json` file is already included to handle client-side routing.
6. Deploy!

### Local Production Preview

To test the production build locally:

```bash
npm run build
npm run preview
```

## License

[MIT License](LICENSE)
