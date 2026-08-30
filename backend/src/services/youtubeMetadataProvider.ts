import { spawn } from 'node:child_process';
import { config } from '../config';
import { MetadataFormat, NormalizedMetadata, PlaylistMetadata, VideoMetadata } from '../types/metadata';
import { MetadataProvider } from './metadataProvider';

type SpawnProcess = typeof spawn;

export type MetadataProviderErrorCode = 'METADATA_UNAVAILABLE' | 'METADATA_TIMEOUT' | 'METADATA_FAILED';

export class MetadataProviderError extends Error {
  constructor(public readonly code: MetadataProviderErrorCode) { super(code); }
}

interface RawFormat { format_id?: string | number; vcodec?: string; acodec?: string; ext?: string; format_note?: string; height?: number; width?: number; fps?: number; filesize?: number; filesize_approx?: number; }
interface RawEntry { id?: string; webpage_url?: string; title?: string; thumbnail?: string; duration?: number; }
interface RawMetadata { _type?: string; id?: string; webpage_url?: string; original_url?: string; title?: string; description?: string; thumbnail?: string; duration?: number; channel_id?: string; channel?: string; uploader?: string; channel_url?: string; view_count?: number; upload_date?: string; formats?: RawFormat[]; entries?: Array<RawEntry | null>; playlist_id?: string; }

function numberOrNull(value: unknown): number | null { return typeof value === 'number' && Number.isFinite(value) ? value : null; }

function format(raw: RawFormat): MetadataFormat {
  const hasVideo = Boolean(raw.vcodec && raw.vcodec !== 'none');
  return { formatId: String(raw.format_id || ''), type: hasVideo ? 'video' : 'audio', container: raw.ext || null, quality: raw.format_note || (raw.height ? `${raw.height}p` : null), width: numberOrNull(raw.width), height: numberOrNull(raw.height), fps: numberOrNull(raw.fps), filesize: numberOrNull(raw.filesize ?? raw.filesize_approx) };
}

function normalize(raw: RawMetadata, requestedUrl: URL): NormalizedMetadata {
  if (raw._type === 'playlist' || raw.entries) {
    const items = (raw.entries || []).filter((entry): entry is RawEntry => Boolean(entry?.id)).map((entry) => ({ id: entry.id as string, url: entry.webpage_url || `https://www.youtube.com/watch?v=${entry.id}`, title: entry.title || '', thumbnail: entry.thumbnail || null, duration: numberOrNull(entry.duration) }));
    const playlist: PlaylistMetadata = { type: 'playlist', platform: 'youtube', id: raw.id || raw.playlist_id || '', url: raw.webpage_url || requestedUrl.toString(), title: raw.title || '', description: raw.description || null, thumbnail: raw.thumbnail || null, itemCount: items.length, items };
    return playlist;
  }
  const video: VideoMetadata = { type: 'video', platform: 'youtube', id: raw.id || '', url: raw.webpage_url || raw.original_url || requestedUrl.toString(), title: raw.title || '', description: raw.description || null, thumbnail: raw.thumbnail || null, duration: numberOrNull(raw.duration), channel: { id: raw.channel_id || null, name: raw.channel || raw.uploader || null, url: raw.channel_url || null }, viewCount: numberOrNull(raw.view_count), uploadDate: raw.upload_date || null, formats: (raw.formats || []).map(format).filter((item) => item.formatId) };
  return video;
}

export class YouTubeMetadataProvider implements MetadataProvider {
  constructor(private readonly executable = config.ytDlpPath, private readonly timeoutMs = config.metadataTimeoutMs, private readonly spawnProcess: SpawnProcess = spawn) {}

  analyze(url: URL): Promise<NormalizedMetadata> {
    return new Promise((resolve, reject) => {
      const args = ['--dump-single-json', '--no-warnings', '--skip-download', '--ignore-errors', url.toString()];
      const child = this.spawnProcess(this.executable, args, { shell: false, windowsHide: true });
      let stdout = ''; let stderr = ''; let settled = false;
      const timer = setTimeout(() => { if (!settled) { settled = true; child.kill('SIGTERM'); reject(new MetadataProviderError('METADATA_TIMEOUT')); } }, this.timeoutMs);
      const fail = (code: MetadataProviderErrorCode) => { if (!settled) { settled = true; clearTimeout(timer); reject(new MetadataProviderError(code)); } };
      child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); if (Buffer.byteLength(stdout) > 5 * 1024 * 1024) { child.kill('SIGTERM'); fail('METADATA_FAILED'); } });
      child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); if (Buffer.byteLength(stderr) > 64 * 1024) child.kill('SIGTERM'); });
      child.on('error', (error: NodeJS.ErrnoException) => fail(error.code === 'ENOENT' ? 'METADATA_UNAVAILABLE' : 'METADATA_FAILED'));
      child.on('close', (code) => { if (settled) return; settled = true; clearTimeout(timer); if (code !== 0) { reject(new MetadataProviderError('METADATA_FAILED')); return; } try { resolve(normalize(JSON.parse(stdout) as RawMetadata, url)); } catch { reject(new MetadataProviderError('METADATA_FAILED')); } });
    });
  }
}