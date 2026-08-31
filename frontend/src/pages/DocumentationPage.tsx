import { useTranslation } from 'react-i18next';
import { BookOpen, CheckCircle2, Download, Clock3, Wand2 } from 'lucide-react';
import { Seo } from '../components/Seo';

export function DocumentationPage() {
  const { t } = useTranslation();

  const sections = [
    {
      icon: Download,
      title: 'How it works',
      text: 'Paste a supported URL, review the metadata, choose the quality and format you want, and queue the download in a few taps.',
    },
    {
      icon: Wand2,
      title: 'Format control',
      text: 'SaveIt supports common video and audio outputs such as MP4, WebM, and MP3, letting you choose the exact output that matches your workflow.',
    },
    {
      icon: Clock3,
      title: 'Scheduler',
      text: 'Set a future time for a download and let SaveIt run it automatically without needing to keep the page open.',
    },
    {
      icon: CheckCircle2,
      title: 'Reliable downloads',
      text: 'Every saved item is tracked in your history, with favorites and quick re-download actions for the content you revisit most.',
    },
  ];

  return (
    <>
      <Seo
        title="SaveIt | Documentation"
        description="Learn how SaveIt works, how to queue downloads, and how to manage quality, format, and scheduling for your saved videos."
        path="/documentation"
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          <BookOpen className="h-4 w-4" />
          {t('documentation.title')}
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Everything you need to save smarter</h1>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {sections.map(({ icon: Icon, title, text }) => (
          <article key={title} className="glass-card p-6">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-sm leading-6 text-slate-600">{text}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Quick start guide</h2>
        <ol className="space-y-3 text-slate-600">
          <li><strong className="text-slate-900">1.</strong> Open the downloader and paste a supported URL.</li>
          <li><strong className="text-slate-900">2.</strong> Review the metadata and choose your format or quality.</li>
          <li><strong className="text-slate-900">3.</strong> Queue the download or schedule it for a later time.</li>
          <li><strong className="text-slate-900">4.</strong> Track progress from History and revisit favorites at any time.</li>
        </ol>
      </div>
      </div>
    </>
  );
}
