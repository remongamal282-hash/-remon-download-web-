import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Download,
  Zap,
  Star,
  Clock,
  History,
  ArrowRight,
  CheckCircle2,
  Monitor,
} from 'lucide-react';
import { Seo } from '../components/Seo';

export function HomePage() {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');

  const features = [
    { icon: Zap, key: 'feature_fast', descKey: 'feature_fast_desc' },
    { icon: Star, key: 'feature_quality', descKey: 'feature_quality_desc' },
    { icon: Clock, key: 'feature_scheduler', descKey: 'feature_scheduler_desc' },
    { icon: History, key: 'feature_history', descKey: 'feature_history_desc' },
  ];

  const steps = [
    { num: '01', key: 'step1' },
    { num: '02', key: 'step2' },
    { num: '03', key: 'step3' },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SaveIt',
    url: import.meta.env.VITE_SITE_URL || window.location.origin,
    description: t('home.hero_subtitle'),
  };

  return (
    <>
      <Seo
        title="SaveIt | Save videos and playlists"
        description={t('home.hero_subtitle')}
        path="/"
        ogTitle="SaveIt"
        ogDescription={t('home.hero_subtitle')}
        structuredData={structuredData}
      />
      <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,197,94,0.15), transparent)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{
              background: 'var(--color-brand-green-muted)',
              border: '1px solid var(--color-brand-green-border)',
              color: 'var(--color-brand-green)',
            }}
          >
            <CheckCircle2 size={12} />
            Free • No Sign-up Required • Blazing Fast
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {t('home.hero_title')}{' '}
            <span className="text-gradient">{t('home.hero_title_accent')}</span>
          </h1>

          <p className="text-lg max-w-2xl mx-auto mb-10"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {t('home.hero_subtitle')}
          </p>

          {/* URL Input */}
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="hero-url-input" className="sr-only">
                {t('home.url_placeholder')}
              </label>
              <input
                id="hero-url-input"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t('home.url_placeholder')}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-emerald-500"
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border-brand)',
                  color: 'var(--color-text-primary)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-brand-green)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-brand-green-muted)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-brand)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            <Link
              to={`/downloader${url ? `?url=${encodeURIComponent(url)}` : ''}`}
              id="hero-analyze-btn"
              aria-label={t('home.analyze_button')}
              className="btn-primary whitespace-nowrap"
            >
              <Download size={16} />
              {t('home.analyze_button')}
            </Link>
          </div>

          {/* Supported Platforms */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {t('home.supported_platforms')}:
            </span>
            {['YouTube', 'YouTube Shorts', 'Playlists', 'Vimeo', 'Twitter/X', 'TikTok', '+1000 more'].map(
              (platform) => (
                <span
                  key={platform}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {platform}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className="text-2xl sm:text-3xl font-bold text-center mb-12"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {t('home.features_title')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, key, descKey }) => (
              <div key={key} className="glass-card p-6">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: 'var(--color-brand-green-muted)' }}
                >
                  <Icon size={20} style={{ color: 'var(--color-brand-green)' }} />
                </div>
                <h3
                  className="font-semibold text-sm mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {t(`home.${key}`)}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {t(`home.${descKey}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className="text-2xl sm:text-3xl font-bold text-center mb-12"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {t('home.how_it_works')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {steps.map(({ num, key }, i) => (
              <div key={key} className="text-center relative">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-xl"
                  style={{
                    background: 'var(--color-brand-green-muted)',
                    border: '1px solid var(--color-brand-green-border)',
                    color: 'var(--color-brand-green)',
                  }}
                >
                  {num}
                </div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {t(`home.${key}`)}
                </h3>
                {i < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-8 ltr:left-[calc(50%+3rem)] rtl:right-[calc(50%+3rem)] w-[calc(100%-6rem)]"
                    style={{
                      borderTop: '1px dashed var(--color-border-brand)',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Desktop App Promo ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-2xl p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6"
            style={{
              background: 'linear-gradient(135deg, var(--color-bg-card) 0%, var(--color-bg-card-hover) 100%)',
              border: '1px solid var(--color-border-brand)',
            }}
          >
            <div className="flex items-center gap-5">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'var(--color-brand-green-muted)',
                  border: '1px solid var(--color-brand-green-border)',
                }}
              >
                <Monitor size={26} style={{ color: 'var(--color-brand-green)' }} />
              </div>
              <div>
                <h2
                  className="text-xl font-bold mb-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {t('home.desktop_promo_title')}
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('home.desktop_promo_desc')}
                </p>
              </div>
            </div>
            <Link
              to="/desktop"
              id="desktop-promo-btn"
              className="btn-primary whitespace-nowrap flex-shrink-0"
            >
              {t('home.download_desktop')}
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
