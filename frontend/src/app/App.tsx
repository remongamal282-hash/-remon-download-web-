import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { useSettingsStore } from '../stores/useSettingsStore';
import { applyDirection } from '../i18n';
import { useAuthStore } from '../stores/useAuthStore';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { NotFoundPage } from '../pages/NotFoundPage';

// Lazy-load pages for code splitting
const HomePage = lazy(() => import('../pages/HomePage').then((m) => ({ default: m.HomePage })));
const DownloaderPage = lazy(() => import('../pages/DownloaderPage').then((m) => ({ default: m.DownloaderPage })));
const HistoryPage = lazy(() => import('../pages/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const FavoritesPage = lazy(() => import('../pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
const SchedulerPage = lazy(() => import('../pages/SchedulerPage').then((m) => ({ default: m.SchedulerPage })));
const SettingsPage = lazy(() => import('../pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const DesktopPage = lazy(() => import('../pages/DesktopPage').then((m) => ({ default: m.DesktopPage })));
const DocumentationPage = lazy(() => import('../pages/DocumentationPage').then((m) => ({ default: m.DocumentationPage })));
const AboutPage = lazy(() => import('../pages/AboutPage').then((m) => ({ default: m.AboutPage })));

function PageLoader() {
  return (
    <div
      className="flex items-center justify-center min-h-64"
      style={{ color: 'var(--color-text-muted)' }}
    >
      <div
        className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--color-brand-green)', borderTopColor: 'transparent' }}
      />
    </div>
  );
}

export function App() {
  const { language } = useSettingsStore();
  const initializeAuth = useAuthStore((state) => state.initialize);

  // Sync document direction on mount and language change
  useEffect(() => {
    applyDirection(language);
  }, [language]);

  useEffect(() => { void initializeAuth(); }, [initializeAuth]);

  return (
    <BrowserRouter>
      <MainLayout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/desktop" element={<DesktopPage />} />
            <Route path="/documentation" element={<DocumentationPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/downloader" element={<DownloaderPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/scheduler" element={<SchedulerPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </MainLayout>
    </BrowserRouter>
  );
}
