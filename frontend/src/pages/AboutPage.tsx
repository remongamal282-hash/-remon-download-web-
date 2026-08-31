import { useTranslation } from 'react-i18next';
import { Info, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Seo } from '../components/Seo';

export function AboutPage() {
  const { t } = useTranslation();

  const values = [
    { icon: Sparkles, title: 'Built for simplicity', text: 'SaveIt focuses on a streamlined experience that keeps your downloads fast, clear, and easy to manage.' },
    { icon: ShieldCheck, title: 'Built with trust', text: 'We prioritize a privacy-aware, user-controlled workflow so you stay in charge of your saved content.' },
    { icon: Users, title: 'Made for everyday use', text: 'From quick personal downloads to scheduled jobs, SaveIt is designed for people who need a reliable workflow without friction.' },
  ];

  return (
    <>
      <Seo
        title="About SaveIt"
        description="Learn what SaveIt is, how it works, and why it is built for a simple, reliable download experience."
        path="/about"
      />
      <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          <Info className="h-4 w-4" />
          {t('about.title')}
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">A cleaner way to keep the media you love</h1>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-lg leading-8 text-slate-600">
          SaveIt is a web-first download experience designed around speed, clarity, and control. We help users collect media they care about in a way that feels effortless, whether they are saving a single video or planning a recurring download.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {values.map(({ icon: Icon, title, text }) => (
          <article key={title} className="glass-card p-6">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-sm leading-6 text-slate-600">{text}</p>
          </article>
        ))}
      </div>
      </div>
    </>
  );
}
