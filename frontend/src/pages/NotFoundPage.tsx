import { Link } from 'react-router-dom';
import { Home, SearchX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Seo } from '../components/Seo';

export function NotFoundPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <>
      <Seo
        title={t('not_found.title')}
        description={t('not_found.description')}
        path="/404"
        noindex
      />
      <main className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-4 py-16" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="glass-card w-full max-w-xl p-8 text-center sm:p-10">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <SearchX className="h-8 w-8" />
          </div>
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">
            SaveIt
          </p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{t('not_found.title')}</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">{t('not_found.description')}</p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/" className="btn-primary inline-flex items-center gap-2">
              <Home className="h-4 w-4" />
              {t('not_found.home')}
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
