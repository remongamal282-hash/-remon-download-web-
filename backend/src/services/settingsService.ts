import { SettingsRepository } from '../repositories/SettingsRepository';
import { SettingsInput, SettingsRecord } from '../types/settings';

export type SettingsServiceErrorCode = 'INVALID_QUALITY' | 'INVALID_FORMAT' | 'INVALID_LANGUAGE' | 'INVALID_THEME' | 'INVALID_CONCURRENCY';

export class SettingsServiceError extends Error {
  constructor(public readonly code: SettingsServiceErrorCode) {
    super(code);
  }
}

const VALID_QUALITIES = ['best', '2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p', 'audio_only'];
const VALID_FORMATS = ['mp4', 'webm', 'mp3', 'm4a', 'aac'];
const VALID_LANGUAGES = ['en', 'ar'];
const VALID_THEMES = ['light', 'dark', 'system'];

export class SettingsService {
  constructor(private readonly repository = new SettingsRepository()) { }

  async getOrCreate(userId: string): Promise<SettingsRecord> {
    const existing = await this.repository.findByUserId(userId);
    if (existing) return this.normalize(existing);
    return this.normalize(await this.repository.create(userId, this.defaultSettings()));
  }

  async update(userId: string, input: SettingsInput): Promise<SettingsRecord> {
    this.validate(input);
    const existing = await this.repository.findByUserId(userId);
    if (!existing) {
      const created = await this.repository.create(userId, { ...this.defaultSettings(), ...input, downloadPath: null });
      return this.normalize(created);
    }

    const updated = await this.repository.update(userId, { ...existing, ...input, downloadPath: null });
    if (!updated) {
      throw new SettingsServiceError('INVALID_CONCURRENCY');
    }
    return this.normalize(updated);
  }

  private normalize(record: SettingsRecord): SettingsRecord {
    return {
      ...record,
      downloadPath: null,
      defaultQuality: record.defaultQuality || 'best',
      defaultFormat: record.defaultFormat || 'mp4',
      language: VALID_LANGUAGES.includes(record.language) ? record.language : 'en',
      theme: VALID_THEMES.includes(record.theme) ? record.theme : 'light',
      notificationsEnabled: record.notificationsEnabled ?? true,
      concurrentDownloads: Number.isInteger(record.concurrentDownloads) && record.concurrentDownloads > 0 ? record.concurrentDownloads : 3,
    };
  }

  private validate(input: SettingsInput): void {
    const candidate = input as Record<string, unknown>;

    if (candidate.defaultQuality !== undefined && typeof candidate.defaultQuality === 'string' && !VALID_QUALITIES.includes(candidate.defaultQuality)) {
      throw new SettingsServiceError('INVALID_QUALITY');
    }

    if (candidate.defaultFormat !== undefined && typeof candidate.defaultFormat === 'string' && !VALID_FORMATS.includes(candidate.defaultFormat)) {
      throw new SettingsServiceError('INVALID_FORMAT');
    }

    if (candidate.language !== undefined && typeof candidate.language === 'string' && !VALID_LANGUAGES.includes(candidate.language)) {
      throw new SettingsServiceError('INVALID_LANGUAGE');
    }

    if (candidate.theme !== undefined && typeof candidate.theme === 'string' && !VALID_THEMES.includes(candidate.theme)) {
      throw new SettingsServiceError('INVALID_THEME');
    }

    if (candidate.concurrentDownloads !== undefined && (!Number.isInteger(candidate.concurrentDownloads) || Number(candidate.concurrentDownloads) < 1 || Number(candidate.concurrentDownloads) > 10)) {
      throw new SettingsServiceError('INVALID_CONCURRENCY');
    }

    if (candidate.notificationsEnabled !== undefined && typeof candidate.notificationsEnabled !== 'boolean') {
      throw new SettingsServiceError('INVALID_THEME');
    }
  }

  private defaultSettings(): SettingsInput {
    return {
      defaultQuality: 'best',
      defaultFormat: 'mp4',
      language: 'en',
      theme: 'light',
      notificationsEnabled: true,
      concurrentDownloads: 3,
      downloadPath: null,
    };
  }
}
