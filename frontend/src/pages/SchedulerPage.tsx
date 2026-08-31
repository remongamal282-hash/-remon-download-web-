import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Plus, Trash2, Power, LoaderCircle } from 'lucide-react';
import { createSchedule, deleteSchedule, getSchedules, toggleSchedule, updateSchedule, type Schedule } from '../api/scheduler';
import { Seo } from '../components/Seo';

const emptyForm = {
  url: '',
  scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
  quality: 'best',
  format: 'mp4',
  enabled: true,
};

export function SchedulerPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    void loadSchedules();
  }, []);

  async function loadSchedules() {
    setLoading(true);
    setError(null);
    try {
      const items = await getSchedules();
      setSchedules(items);
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

    try {
      if (editingId) {
        const updated = await updateSchedule(editingId, {
          url: form.url,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          quality: form.quality,
          format: form.format,
          enabled: form.enabled,
        });
        setSchedules((current) => current.map((item) => item.id === updated.id ? updated : item));
      } else {
        const created = await createSchedule({
          url: form.url,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          quality: form.quality,
          format: form.format,
          enabled: form.enabled,
        });
        setSchedules((current) => [created, ...current]);
      }
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string, enabled: boolean) {
    try {
      const updated = await toggleSchedule(id, enabled);
      setSchedules((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSchedule(id);
      setSchedules((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  }

  const sortedSchedules = useMemo(() => [...schedules].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()), [schedules]);

  return (
    <>
      <Seo title="SaveIt | Scheduler" description="Manage scheduled downloads." path="/scheduler" noindex />
      <div className="mx-auto max-w-6xl px-4 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="h-7 w-7 text-emerald-500" />
          <h1 className="text-3xl font-bold text-slate-900">{t('scheduler.title')}</h1>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
          <Plus className="h-5 w-5 text-emerald-500" />
          {editingId ? 'Edit Schedule' : t('scheduler.create')}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-2 text-sm font-medium text-slate-700 xl:col-span-2">
            <span>{t('scheduler.url')}</span>
            <input
              type="url"
              required
              value={form.url}
              onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{t('scheduler.quality')}</span>
            <select
              value={form.quality}
              onChange={(event) => setForm((current) => ({ ...current, quality: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-500"
            >
              <option value="best">best</option>
              <option value="2160p">2160p</option>
              <option value="1440p">1440p</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
              <option value="360p">360p</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{t('scheduler.format')}</span>
            <select
              value={form.format}
              onChange={(event) => setForm((current) => ({ ...current, format: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-500"
            >
              <option value="mp4">mp4</option>
              <option value="webm">webm</option>
              <option value="mp3">mp3</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{t('scheduler.schedule_time')}</span>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-500"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
            />
            {t('scheduler.enable')}
          </label>

          <div className="flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              >
                {t('common.cancel')}
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? t('common.loading') : editingId ? 'Update' : t('scheduler.create')}
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          <LoaderCircle className="mx-auto mb-2 h-5 w-5 animate-spin" />
          {t('common.loading')}
        </div>
      ) : sortedSchedules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          {t('scheduler.empty')}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedSchedules.map((schedule) => (
            <div key={schedule.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {schedule.status}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${schedule.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      {schedule.enabled ? 'enabled' : 'disabled'}
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">{schedule.title || schedule.url}</p>
                  <p className="break-all text-sm text-slate-600">{schedule.url}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(schedule.id, !schedule.enabled)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-600"
                  >
                    <Power className="mr-1 inline h-4 w-4" />
                    {schedule.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(schedule.id);
                      setForm({
                        url: schedule.url,
                        scheduledAt: new Date(schedule.scheduledAt).toISOString().slice(0, 16),
                        quality: schedule.quality || 'best',
                        format: schedule.format || 'mp4',
                        enabled: schedule.enabled,
                      });
                    }}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-600"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(schedule.id)}
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="mr-1 inline h-4 w-4" />
                    {t('scheduler.delete')}
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-4">
                <div><span className="font-medium text-slate-800">Time:</span> {new Date(schedule.scheduledAt).toLocaleString(i18n.language)}</div>
                <div><span className="font-medium text-slate-800">Quality:</span> {schedule.quality || 'best'}</div>
                <div><span className="font-medium text-slate-800">Format:</span> {schedule.format || 'mp4'}</div>
                <div><span className="font-medium text-slate-800">Updated:</span> {new Date(schedule.updatedAt).toLocaleDateString(i18n.language)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
