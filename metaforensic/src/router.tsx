import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { AppLayout } from './components/layout/AppLayout';
import { Index } from './pages/Index';
import { AnalysisWorkspace } from './pages/AnalysisWorkspace';
import { PrivacyAnalysis } from './pages/PrivacyAnalysis';
import { MetadataCleaner } from './pages/MetadataCleaner';
import { Export } from './pages/Export';

const rootRoute = createRootRoute({
  component: AppLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Index,
});

const analysisRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analysis',
  component: AnalysisWorkspace,
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/privacy',
  component: PrivacyAnalysis,
});

const cleanerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cleaner',
  component: MetadataCleaner,
});

const exportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/export',
  component: Export,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  analysisRoute,
  privacyRoute,
  cleanerRoute,
  exportRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
