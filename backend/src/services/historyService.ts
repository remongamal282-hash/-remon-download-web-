import { HistoryRepository } from '../repositories/HistoryRepository';
import { HistoryRecord, HistoryListResponse, PaginationMeta } from '../types/history';
import { DownloadService } from './downloadService';

export class HistoryServiceError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

export class HistoryService {
  constructor(private readonly repository = new HistoryRepository(), private readonly downloadService = new DownloadService()) { }

  async list(userId: string, page: number = 1, limit: number = 20, search?: string): Promise<HistoryListResponse> {
    const validatedLimit = Math.min(Math.max(limit, 1), 100);
    const validatedPage = Math.max(page, 1);
    const { records, total } = await this.repository.listForUser(userId, validatedPage, validatedLimit, search);
    return {
      data: records,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages: Math.ceil(total / validatedLimit),
      },
    };
  }

  async get(userId: string, id: string): Promise<HistoryRecord> {
    const record = await this.repository.findByIdForUser(id, userId);
    if (!record) throw new HistoryServiceError('HISTORY_NOT_FOUND');
    return record;
  }

  async delete(userId: string, id: string): Promise<void> {
    const deleted = await this.repository.delete(id, userId);
    if (!deleted) throw new HistoryServiceError('HISTORY_NOT_FOUND');
  }

  async redownload(userId: string, id: string): Promise<{ downloadId: string }> {
    const record = await this.get(userId, id);
    const newDownload = await this.downloadService.create(userId, {
      url: record.url,
      format: record.format || 'bestvideo+bestaudio/best',
      quality: record.quality || '720p',
      outputFormat: 'mp4',
    });
    return { downloadId: newDownload.id };
  }
}
