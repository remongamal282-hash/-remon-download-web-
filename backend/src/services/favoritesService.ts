import { FavoriteRepository } from '../repositories/FavoriteRepository';
import { FavoriteRecord, FavoritesListResponse } from '../types/favorites';
import { DownloadService } from './downloadService';

export class FavoritesServiceError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

export class FavoritesService {
  constructor(private readonly repository = new FavoriteRepository(), private readonly downloadService = new DownloadService()) { }

  async list(userId: string, page: number = 1, limit: number = 20, search?: string): Promise<FavoritesListResponse> {
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

  async get(userId: string, id: string): Promise<FavoriteRecord> {
    const record = await this.repository.findByIdForUser(id, userId);
    if (!record) throw new FavoritesServiceError('FAVORITE_NOT_FOUND');
    return record;
  }

  async add(userId: string, data: { url: string; title?: string | null; thumbnailUrl?: string | null; mediaType?: string | null; duration?: number | null }): Promise<FavoriteRecord> {
    this.validateUrl(data.url);
    const existing = await this.repository.findByUrlForUser(data.url, userId);
    if (existing) throw new FavoritesServiceError('FAVORITE_DUPLICATE');
    return this.repository.create(userId, data);
  }

  async delete(userId: string, id: string): Promise<void> {
    const deleted = await this.repository.delete(id, userId);
    if (!deleted) throw new FavoritesServiceError('FAVORITE_NOT_FOUND');
  }

  async download(userId: string, id: string, options?: { quality?: string; format?: string }): Promise<{ downloadId: string }> {
    const record = await this.get(userId, id);
    const newDownload = await this.downloadService.create(userId, {
      url: record.url,
      format: options?.format || 'bestvideo+bestaudio/best',
      quality: options?.quality || '720p',
      outputFormat: 'mp4',
    });
    return { downloadId: newDownload.id };
  }

  private validateUrl(url: string): void {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new FavoritesServiceError('INVALID_URL');
    }
    const host = parsedUrl.hostname.toLowerCase();
    if (!['http:', 'https:'].includes(parsedUrl.protocol) || !(host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com'))) {
      throw new FavoritesServiceError('INVALID_URL');
    }
  }
}
