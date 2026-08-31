import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../stores/useSettingsStore';
import {
  Download,
  Home,
  History,
  Heart,
  Calendar,
  Monitor,
  BookOpen,
  Info,
  Globe,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';

const NAV_ITEMS = [
  { path: '/', key: 'home', icon: Home },
  { path: '/downloader', key: 'downloader', icon: Download },
  { path: '/history', key: 'history', icon: History },
  { path: '/favorites', key: 'favorites', icon: Heart },
  { path: '/scheduler', key: 'scheduler', icon: Calendar },
  { path: '/desktop', key: 'desktop', icon: Monitor },
  { path: '/documentation', key: 'documentation', icon: BookOpen },
  { path: '/about', key: 'about', icon: Info },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { language, setLanguage } = useSettingsStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, status, logout } = useAuthStore();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      {/* ── Header ── */}
      <header
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.82)',
          borderBottom: '1px solid var(--color-border)',
          backdropFilter: 'blur(12px)',
        }}
        className="sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  boxShadow: '0 0 12px rgba(34,197,94,0.4)',
                }}
              >
                <Download size={16} color="#000" strokeWidth={2.5} />
              </div>
              <span
                className="font-bold text-base tracking-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Save<span style={{ color: 'var(--color-brand-green)' }}>It</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map(({ path, key, icon: Icon }) => (
                <NavLink
                  key={key}
                  to={path}
                  end={path === '/'}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon size={14} />
                  {t(`nav.${key}`)}
                </NavLink>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {status === 'authenticated' ? <button className="btn-ghost text-xs px-3 py-2" onClick={() => void logout()}>{user?.displayName || user?.email} · {t('auth.logout')}</button> : <Link className="btn-ghost text-xs px-3 py-2" to="/login">{t('auth.login')}</Link>}
              {/* Language Toggle */}
              <button
                id="lang-toggle-btn"
                onClick={toggleLanguage}
                className="btn-ghost text-xs px-3 py-2"
                title="Toggle Language"
              >
                <Globe size={14} />
                {language === 'en' ? 'عربي' : 'English'}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                id="mobile-menu-btn"
                className="lg:hidden btn-ghost p-2"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div
            style={{ borderTop: '1px solid var(--color-border)' }}
            className="lg:hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              {NAV_ITEMS.map(({ path, key, icon: Icon }) => (
                <NavLink
                  key={key}
                  to={path}
                  end={path === '/'}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''} w-full`
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={15} />
                  {t(`nav.${key}`)}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-surface)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                >
                  <Download size={13} color="#000" strokeWidth={2.5} />
                </div>
                <span
                  className="font-bold text-sm"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Save<span style={{ color: 'var(--color-brand-green)' }}>It</span>
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {t('footer.tagline')}
              </p>
            </div>

            {/* Links */}
            <div>
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {t('footer.links')}
              </h3>
              <ul className="space-y-2">
                {[
                  { path: '/downloader', key: 'downloader' },
                  { path: '/history', key: 'history' },
                  { path: '/desktop', key: 'desktop' },
                  { path: '/about', key: 'about' },
                ].map(({ path, key }) => (
                  <li key={key}>
                    <Link
                      to={path}
                      className="text-sm hover:text-white transition-colors"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {t(`nav.${key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {t('footer.legal')}
              </h3>
              <ul className="space-y-2">
                {[
                  { path: '/privacy', label: t('footer.privacy') },
                  { path: '/terms', label: t('footer.terms') },
                  { path: '/contact', label: t('footer.contact') },
                ].map(({ path, label }) => (
                  <li key={path}>
                    <Link
                      to={path}
                      className="text-sm hover:text-white transition-colors"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <hr className="divider my-6" />
          <p className="text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
            © {new Date().getFullYear()} SaveIt. {t('footer.rights')}
          </p>
        </div>
      </footer>
    </div>
  );
}
