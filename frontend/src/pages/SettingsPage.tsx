import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';
import { getSettings, updateSettings, type UserSettings } from '../api/settings';
import { useSettingsStore } from '../stores/useSettingsStore';
import { Seo } from '../components/Seo';

type SettingsForm = {
  defaultQuality: string;
  defaultFormat: string;
  concurrentDownloads: number;
  language: 'en' | 'ar';
  theme: 'light' | 'dark' | 'system';
};

const defaultForm: SettingsForm = {
  defaultQuality: 'best',
  defaultFormat: 'mp4',
  concurrentDownloads: 3,
  language: 'en',
  theme: 'light',
};

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { setLanguage, setTheme } = useSettingsStore();
  const isRTL = i18n.language === 'ar';
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const settings = await getSettings();
      setForm({
        defaultQuality: settings.defaultQuality || 'best',
        defaultFormat: settings.defaultFormat || 'mp4',
        concurrentDownloads: settings.concurrentDownloads || 3,
        language: settings.language === 'ar' ? 'ar' : 'en',
        theme: settings.theme === 'dark' || settings.theme === 'system' ? settings.theme : 'light',
      });
      setLanguage(settings.language === 'ar' ? 'ar' : 'en');
      setTheme(settings.theme === 'dark' || settings.theme === 'system' ? settings.theme : 'light');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateSettings({
        defaultQuality: form.defaultQuality,
        defaultFormat: form.defaultFormat,
        concurrentDownloads: form.concurrentDownloads,
        language: form.language,
        theme: form.theme,
      } as Partial<UserSettings>);
      setForm({
        defaultQuality: updated.defaultQuality || 'best',
        defaultFormat: updated.defaultFormat || 'mp4',
        concurrentDownloads: updated.concurrentDownloads || 3,
        language: updated.language === 'ar' ? 'ar' : 'en',
        theme: updated.theme === 'dark' || updated.theme === 'system' ? updated.theme : 'light',
      });
      setLanguage(updated.language === 'ar' ? 'ar' : 'en');
      setTheme(updated.theme === 'dark' || updated.theme === 'system' ? updated.theme : 'light');
      setSuccess(t('common.save'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Seo title="SaveIt | Settings" description="Manage your SaveIt preferences." path="/settings" noindex />
      <div className="mx-auto max-w-3xl px-4 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-6 flex items-center gap-3">
        <Settings className="h-7 w-7 text-emerald-500" />
        <h1 className="text-3xl font-bold text-slate-900">{t('settings.title')}</h1>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">{t('common.loading')}</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>{t('settings.default_quality')}</span>
              <select
                value={form.defaultQuality}
                onChange={(event) => setForm((current) => ({ ...current, defaultQuality: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none ring-0 focus:border-emerald-500"
              >
                <option value="best">best</option>
                <option value="2160p">2160p</option>
                <option value="1440p">1440p</option>
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
                <option value="360p">360p</option>
                <option value="240p">240p</option>
                <option value="audio_only">audio_only</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>{t('settings.default_format')}</span>
              <select
                value={form.defaultFormat}
                onChange={(event) => setForm((current) => ({ ...current, defaultFormat: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none ring-0 focus:border-emerald-500"
              >
                <option value="mp4">mp4</option>
                <option value="webm">webm</option>
                <option value="mp3">mp3</option>
                <option value="m4a">m4a</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>{t('settings.concurrent_downloads')}</span>
              <input
                type="number"
                min={1}
                max={10}
                value={form.concurrentDownloads}
                onChange={(event) => setForm((current) => ({ ...current, concurrentDownloads: Number(event.target.value) || 1 }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-500"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>{t('settings.language')}</span>
              <select
                value={form.language}
                onChange={(event) => setForm((current) => ({ ...current, language: event.target.value as 'en' | 'ar' }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-500"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>{t('settings.theme')}</span>
              <select
                value={form.theme}
                onChange={(event) => setForm((current) => ({ ...current, theme: event.target.value as 'light' | 'dark' | 'system' }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      )}
      </div>
    </>
  );
}
