import { useTranslation } from 'react-i18next';
import { Monitor, Download, CheckCircle2, BadgeCheck, ArrowRight } from 'lucide-react';
import { Seo } from '../components/Seo';

export function DesktopPage() {
  const { t } = useTranslation();

  const platforms = [
    { name: 'Windows', note: 'Fast setup for everyday downloads' },
    { name: 'macOS', note: 'Native-style usability on Apple devices' },
    { name: 'Linux', note: 'Lightweight and reliable for power users' },
  ];

  return (
    <>
      <Seo
        title="SaveIt Desktop App"
        description="Use SaveIt on desktop for a lightweight, focused download workflow on Windows, macOS, and Linux."
        path="/desktop"
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          <Monitor className="h-4 w-4" />
          {t('desktop.title')}
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">SaveIt on your desktop, without the clutter</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {platforms.map((platform) => (
          <article key={platform.name} className="glass-card p-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-lg font-semibold text-slate-900">{platform.name}</span>
              <BadgeCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-sm text-slate-600">{platform.note}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Built for fast, focused downloads</h2>
            <ul className="mt-4 space-y-3 text-slate-600">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Queue and manage downloads more effectively</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Schedule future jobs without opening a browser</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Keep your favorite and recent downloads ready in one place</li>
            </ul>
          </div>

          <button className="btn-primary whitespace-nowrap" type="button">
            <Download className="h-4 w-4" />
            Download app
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      </div>
    </>
  );
}
