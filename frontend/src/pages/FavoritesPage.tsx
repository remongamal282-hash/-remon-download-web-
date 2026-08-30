import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Download, Trash2, Loader } from 'lucide-react';
import type { FavoriteItem } from '../api/favorites';
import { getFavorites, deleteFavorite, downloadFromFavorite } from '../api/favorites';

export function FavoritesPage() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 20;

  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    loadFavorites();
  }, [page, search]);

  async function loadFavorites() {
    setLoading(true);
    setError(null);
    try {
      const response = await getFavorites(page, limit, search || undefined);
      setItems(response.data);
      setTotal(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('favorites.delete_confirm', 'Are you sure?'))) return;
    try {
      await deleteFavorite(id);
      setItems(items.filter((item) => item.id !== id));
      setTotal(total - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  async function handleDownload(id: string) {
    try {
      await downloadFromFavorite(id);
      alert(t('downloader.queued', 'Download queued.'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start download');
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-6 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2">
        <Heart className="h-6 w-6 text-red-500" />
        <h1 className="text-3xl font-bold">{t('favorites.title')}</h1>
      </div>

      <div className="flex gap-2">
        <input type="text" placeholder={t('favorites.search')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="flex-1 rounded border border-gray-300 px-3 py-2" />
      </div>

      {error && <div className="rounded bg-red-100 p-3 text-red-700">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader className="h-6 w-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">{t('favorites.empty')}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              {item.thumbnailUrl && <img src={item.thumbnailUrl} alt={item.title || 'Video'} className="h-40 w-full object-cover" />}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">{item.title || 'Untitled'}</h3>
                {item.duration && <p className="text-sm text-gray-600">{t('downloader.duration')}: {formatDuration(item.duration)}</p>}
                <p className="text-xs text-gray-500 truncate mt-1">{item.url}</p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => handleDownload(item.id)} className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600">
                    <Download className="h-4 w-4" /> {t('favorites.download')}
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="inline-flex items-center justify-center gap-1 rounded bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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

