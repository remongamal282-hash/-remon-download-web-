import { DownloadRepository } from '../repositories/DownloadRepository';
import { DownloadEngine } from '../engine/downloadEngine';
import { DownloadQueue } from '../queue/downloadQueue';
import { CreateDownloadInput, DOWNLOAD_TRANSITIONS, DownloadRecord, DownloadStatus } from '../types/download';

export type DownloadServiceErrorCode = 'INVALID_URL' | 'INVALID_DOWNLOAD_OPTIONS' | 'DOWNLOAD_NOT_FOUND' | 'INVALID_STATE' | 'DOWNLOAD_BUSY';
export class DownloadServiceError extends Error { constructor(public readonly code: DownloadServiceErrorCode) { super(code); } }

function validateInput(input: CreateDownloadInput): CreateDownloadInput {
  let url: URL;
  try { url = new URL(input.url); } catch { throw new DownloadServiceError('INVALID_URL'); }
  const host = url.hostname.toLowerCase();
  if (!['http:', 'https:'].includes(url.protocol) || !(host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com'))) throw new DownloadServiceError('INVALID_URL');
  if (!/^[0-9A-Za-z+./_-]{1,100}$/.test(input.format) || !/^[0-9A-Za-z+./_-]{1,50}$/.test(input.quality) || !['mp4', 'webm', 'mp3'].includes(input.outputFormat)) throw new DownloadServiceError('INVALID_DOWNLOAD_OPTIONS');
  return { ...input, url: url.toString() };
}

export class DownloadService {
  private readonly activeAttempts = new Set<string>();
  constructor(private readonly repository = new DownloadRepository(), private readonly engine = new DownloadEngine(), private readonly queue = new DownloadQueue()) { }

  async create(userId: string, input: CreateDownloadInput): Promise<DownloadRecord> {
    const record = await this.repository.create(userId, validateInput(input));
    this.queue.add({ id: record.id, run: () => this.run(record) });
    return record;
  }

  list(userId: string): Promise<DownloadRecord[]> { return this.repository.listForUser(userId); }
  async get(userId: string, id: string): Promise<DownloadRecord> { return this.owned(userId, id); }

  async pause(userId: string, id: string): Promise<DownloadRecord> {
    const record = await this.owned(userId, id); this.transition(record, 'paused'); this.engine.pause(id); await this.repository.updateStatus(id, 'paused'); return (await this.owned(userId, id));
  }
  async resume(userId: string, id: string): Promise<DownloadRecord> {
    const record = await this.owned(userId, id); this.transition(record, 'downloading'); this.engine.resume(id); await this.repository.updateStatus(id, 'downloading'); return this.owned(userId, id);
  }
  async stop(userId: string, id: string): Promise<DownloadRecord> {
    const record = await this.owned(userId, id); if (!['analyzing', 'downloading', 'paused', 'queued'].includes(record.status)) throw new DownloadServiceError('INVALID_STATE'); this.engine.stop(id); await this.repository.updateStatus(id, 'failed', 'Download stopped'); return this.owned(userId, id);
  }
  async cancel(userId: string, id: string): Promise<DownloadRecord> {
    const record = await this.owned(userId, id); this.transition(record, 'canceled'); this.engine.cancel(id); await this.engine.cleanup(id); await this.repository.updateStatus(id, 'canceled'); return this.owned(userId, id);
  }
  async retry(userId: string, id: string): Promise<DownloadRecord> {
    const record = await this.owned(userId, id); this.transition(record, 'retrying'); if (this.activeAttempts.has(id)) throw new DownloadServiceError('DOWNLOAD_BUSY'); await this.repository.updateStatus(id, 'retrying'); this.activeAttempts.add(id); this.queue.add({ id, run: () => this.run({ ...record, status: 'retrying' }) }); return this.owned(userId, id);
  }

  private async owned(userId: string, id: string): Promise<DownloadRecord> { const record = await this.repository.findByIdForUser(id, userId); if (!record) throw new DownloadServiceError('DOWNLOAD_NOT_FOUND'); return record; }
  private transition(record: DownloadRecord, next: DownloadStatus): void { if (!DOWNLOAD_TRANSITIONS[record.status].includes(next)) throw new DownloadServiceError('INVALID_STATE'); }
  private async run(record: DownloadRecord): Promise<void> {
    try {
      const result = await this.engine.start(record, { state: (status) => this.repository.updateStatus(record.id, status), progress: (progress) => this.repository.updateProgress(record.id, progress, null) });
      await this.repository.updateProgress(record.id, 100, result.fileSize, result.filePath);
    } catch (error: unknown) {
      const message = error instanceof Error && ['DOWNLOAD_TIMEOUT', 'YTDLP_UNAVAILABLE'].includes(error.message) ? error.message : 'Download failed';
      await this.repository.updateStatus(record.id, 'failed', message);
    } finally {
      this.activeAttempts.delete(record.id);
    }
  }
}