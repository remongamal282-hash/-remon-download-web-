import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { History, Download, Trash2, Loader } from 'lucide-react';
import type { HistoryItem } from '../api/history';
import { getHistory, deleteHistoryItem, redownloadFromHistory } from '../api/history';

export function HistoryPage() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 20;

  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    loadHistory();
  }, [page, search]);

  async function loadHistory() {
    setLoading(true);
    setError(null);
    try {
      const response = await getHistory(page, limit, search || undefined);
      setItems(response.data);
      setTotal(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('history.delete_confirm', 'Are you sure?'))) return;
    try {
      await deleteHistoryItem(id);
      setItems(items.filter((item) => item.id !== id));
      setTotal(total - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  async function handleRedownload(id: string) {
    try {
      await redownloadFromHistory(id);
      alert(t('history.redownload_started', 'Download started'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start download');
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <div className="flex flex-col gap-6 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2">
        <History className="h-6 w-6" />
        <h1 className="text-3xl font-bold">{t('history.title')}</h1>
      </div>

      <div className="flex gap-2">
        <input type="text" placeholder={t('history.search')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="flex-1 rounded border border-gray-300 px-3 py-2" />
      </div>

      {error && <div className="rounded bg-red-100 p-3 text-red-700">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader className="h-6 w-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">{t('history.empty')}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className={`px-4 py-2 text-left font-semibold ${isRTL ? 'text-right' : ''}`}>{t('metadata.video')}</th>
                <th className={`px-4 py-2 text-left font-semibold ${isRTL ? 'text-right' : ''}`}>{t('downloader.quality')}</th>
                <th className={`px-4 py-2 text-left font-semibold ${isRTL ? 'text-right' : ''}`}>{t('downloader.format')}</th>
                <th className={`px-4 py-2 text-left font-semibold ${isRTL ? 'text-right' : ''}`}>{t('downloader.duration')}</th>
                <th className={`px-4 py-2 text-left font-semibold ${isRTL ? 'text-right' : ''}`}>{t('home.size', 'Size')}</th>
                <th className={`px-4 py-2 text-left font-semibold ${isRTL ? 'text-right' : ''}`}>{t('home.date', 'Date')}</th>
                <th className={`px-4 py-2 text-left font-semibold ${isRTL ? 'text-right' : ''}`}>{t('home.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={item.title || 'Video'} className="h-10 w-10 rounded object-cover" /> : null}
                    </div>
                    <div className="font-medium text-gray-900">{item.title || 'Untitled'}</div>
                    <div className="text-xs text-gray-500 truncate">{item.url}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.quality || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{item.format || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDuration(item.duration)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatFileSize(item.fileSize)}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleRedownload(item.id)} className="inline-flex items-center gap-1 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600">
                        <Download className="h-3 w-3" /> {t('history.redownload')}
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="inline-flex items-center gap-1 rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600">
                        <Trash2 className="h-3 w-3" /> {t('history.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 rounded border border-gray-300 disabled:opacity-50">
            {t('home.previous', 'Previous')}
          </button>
          <span className="px-4 py-2">
            {page} / {totalPages}
          </span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-4 py-2 rounded border border-gray-300 disabled:opacity-50">
            {t('home.next', 'Next')}
          </button>
        </div>
      )}
    </div>
  );
}

