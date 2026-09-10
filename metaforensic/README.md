# Metaforensic

A privacy-focused browser-based image metadata extractor, analyzer, and cleaner.

## Architecture

This project follows a scalable, component-based architecture optimized for React 19 and Vite.

### Directory Structure

- `src/components/ui/`: Reusable, generic UI primitives (Button, Card, Alert).
- `src/components/layout/`: Application layout components (AppLayout, Header).
- `src/components/features/`: Domain-specific components (ImageUploader).
- `src/context/`: Global React Context providers (FileContext).
- `src/pages/`: Top-level route views.
- `src/services/`: Core logic and domain services (MetadataService).
- `src/hooks/`: Custom React Hooks.
- `src/utils/`: Helper functions (cn).
- `src/types/`: Shared TypeScript definitions.
- `src/config/`: Application configuration (env).

### Tech Stack

- **Framework:** React 19
- **Bundler:** Vite
- **Routing:** TanStack Router
- **Styling:** Tailwind CSS 4
- **Testing:** Vitest + React Testing Library
- **Linting & Formatting:** Oxlint + Prettier
- **Core Libs:** `exifr`, `piexifjs`, `jspdf`

## Available Scripts

- `npm run dev`: Starts the local development server.
- `npm run build`: Compiles TypeScript and builds the production bundle.
- `npm run lint`: Runs Oxlint to check for code issues.
- `npm run format`: Runs Prettier to format all codebase files.
- `npm run test`: Runs the Vitest test suite.
