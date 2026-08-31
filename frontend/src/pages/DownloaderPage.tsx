import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { analyzeUrl } from '../api/metadata';
import type { MetadataResult } from '../api/metadata';
import { createDownload } from '../api/downloads';
import { Seo } from '../components/Seo';

export function DownloaderPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [url, setUrl] = useState(searchParams.get('url') || '');
  const [metadata, setMetadata] = useState<MetadataResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState('');
  useEffect(() => { const initial = searchParams.get('url'); if (initial) void submitUrl(initial); }, [searchParams]);
  async function submitUrl(value: string) { setLoading(true); setError(''); try { setMetadata(await analyzeUrl(value)); } catch { setMetadata(null); setError(t('metadata.failed')); } finally { setLoading(false); } }
  function submit(event: FormEvent) { event.preventDefault(); void submitUrl(url); }
  async function queueDownload(format: string, quality: string) { setDownloadMessage(''); try { await createDownload({ url, format, quality, outputFormat: 'mp4' }); setDownloadMessage(t('downloader.queued')); } catch { setDownloadMessage(t('downloader.download_failed')); } }
  return (
    <>
      <Seo title="SaveIt | Downloader" description="Analyze and save YouTube videos, Shorts, and playlists with SaveIt." path="/downloader" noindex />
      <section className="max-w-4xl mx-auto px-4 py-12"><div className="flex items-center gap-3 mb-8"><Download style={{ color: 'var(--color-brand-green)' }} /><h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('downloader.title')}</h1></div><form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 mb-8"><input required type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder={t('downloader.url_placeholder')} className="flex-1 px-4 py-3 rounded-xl" style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-brand)' }} /><button className="btn-primary justify-center" disabled={loading}>{loading ? t('downloader.analyzing') : t('downloader.analyze')}</button></form>{error && <p role="alert" className="text-red-400 mb-6">{error}</p>}{downloadMessage && <p className="mb-6" style={{ color: 'var(--color-brand-green)' }}>{downloadMessage}</p>}{metadata && <MetadataCard metadata={metadata} onDownload={queueDownload} />}</section>
    </>
  );
}

function MetadataCard({ metadata, onDownload }: { metadata: MetadataResult; onDownload: (format: string, quality: string) => Promise<void> }) {
  const { t } = useTranslation();
  return <article className="glass-card overflow-hidden">{metadata.thumbnail && <img src={metadata.thumbnail} alt={metadata.title} className="w-full max-h-72 object-cover" />}{metadata.type === 'playlist' ? <div className="p-6"><p className="text-xs uppercase" style={{ color: 'var(--color-brand-green)' }}>{t('metadata.playlist')} · {metadata.itemCount}</p><h2 className="text-xl font-bold mt-2" style={{ color: 'var(--color-text-primary)' }}>{metadata.title}</h2></div> : <div className="p-6"><p className="text-xs uppercase" style={{ color: 'var(--color-brand-green)' }}>{t('metadata.video')}</p><h2 className="text-xl font-bold mt-2" style={{ color: 'var(--color-text-primary)' }}>{metadata.title}</h2><p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>{metadata.channel.name || t('metadata.unknown_channel')} · {metadata.duration ? `${Math.floor(metadata.duration / 60)}:${String(Math.floor(metadata.duration % 60)).padStart(2, '0')}` : t('metadata.unknown_duration')}</p><div className="flex flex-wrap gap-2 mt-5">{metadata.formats.map((format) => <button key={format.formatId} onClick={() => void onDownload(format.formatId, format.quality || 'best')} className="px-3 py-1 rounded-full text-xs" style={{ background: 'var(--color-brand-green-muted)', color: 'var(--color-brand-green)' }}>{format.quality || format.container || format.formatId}</button>)}</div></div>}</article>;
}
