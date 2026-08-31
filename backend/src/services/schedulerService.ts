import { DownloadService } from './downloadService';
import { ScheduleRepository } from '../repositories/ScheduleRepository';
import { ScheduleInput, ScheduleRecord } from '../types/scheduler';

export type ScheduleServiceErrorCode = 'INVALID_URL' | 'INVALID_SCHEDULE_TIME' | 'INVALID_QUALITY' | 'INVALID_FORMAT' | 'SCHEDULE_NOT_FOUND' | 'INVALID_STATE';

export class ScheduleServiceError extends Error {
  constructor(public readonly code: ScheduleServiceErrorCode) {
    super(code);
  }
}

const VALID_QUALITIES = ['best', '2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p', 'audio_only'];
const VALID_FORMATS = ['mp4', 'webm', 'mp3', 'm4a', 'aac'];

type SchedulerRepositoryLike = Pick<
  ScheduleRepository,
  'listForUser' | 'findByIdForUser' | 'create' | 'update' | 'delete' | 'setEnabled' | 'listDue' | 'markActive' | 'markCompleted' | 'markFailed'
>;

type SchedulerServiceDependencies = {
  repository?: SchedulerRepositoryLike;
  downloadService?: DownloadService;
};

export class SchedulerService {
  private readonly repository: SchedulerRepositoryLike;
  private readonly downloadService: DownloadService;

  constructor(dependenciesOrRepository: SchedulerRepositoryLike | SchedulerServiceDependencies = new ScheduleRepository(), downloadService = new DownloadService()) {
    if (dependenciesOrRepository && typeof dependenciesOrRepository === 'object' && ('repository' in dependenciesOrRepository || 'downloadService' in dependenciesOrRepository)) {
      const dependencies = dependenciesOrRepository as SchedulerServiceDependencies;
      this.repository = dependencies.repository ?? new ScheduleRepository();
      this.downloadService = dependencies.downloadService ?? downloadService;
      return;
    }

    this.repository = dependenciesOrRepository as SchedulerRepositoryLike;
    this.downloadService = downloadService;
  }

  async list(userId: string): Promise<ScheduleRecord[]> {
    return this.repository.listForUser(userId);
  }

  async get(userId: string, id: string): Promise<ScheduleRecord> {
    const record = await this.repository.findByIdForUser(id, userId);
    if (!record) throw new ScheduleServiceError('SCHEDULE_NOT_FOUND');
    return record;
  }

  async create(userId: string, input: ScheduleInput): Promise<ScheduleRecord> {
    this.validate(input);
    return this.repository.create(userId, input);
  }

  async update(userId: string, id: string, input: Partial<ScheduleInput>): Promise<ScheduleRecord> {
    const existing = await this.get(userId, id);
    const next = { ...existing, ...input };
    this.validate(next as ScheduleInput);
    const updated = await this.repository.update(id, userId, input);
    if (!updated) throw new ScheduleServiceError('SCHEDULE_NOT_FOUND');
    return updated;
  }

  async delete(userId: string, id: string): Promise<void> {
    const deleted = await this.repository.delete(id, userId);
    if (!deleted) throw new ScheduleServiceError('SCHEDULE_NOT_FOUND');
  }

  async setEnabled(userId: string, id: string, enabled: boolean): Promise<ScheduleRecord> {
    const existing = await this.get(userId, id);
    if (existing.enabled === enabled) return existing;
    const updated = await this.repository.setEnabled(id, userId, enabled);
    if (!updated) throw new ScheduleServiceError('SCHEDULE_NOT_FOUND');
    return updated;
  }

  async runDueSchedules(): Promise<number> {
    const due = await this.repository.listDue?.() ?? [];
    let executed = 0;

    for (const schedule of due) {
      const claimed = await this.repository.markActive?.(schedule.id);
      if (!claimed) continue;

      try {
        await this.downloadService.create(schedule.userId, {
          url: schedule.url,
          quality: schedule.quality || 'best',
          format: schedule.format || 'mp4',
          outputFormat: schedule.format || 'mp4',
        });
        await this.repository.markCompleted?.(schedule.id);
        executed += 1;
      } catch {
        await this.repository.markFailed?.(schedule.id);
      }
    }

    return executed;
  }

  private validate(input: ScheduleInput): void {
    if (!input.url || !this.isValidYouTubeUrl(input.url)) throw new ScheduleServiceError('INVALID_URL');
    const scheduledAt = new Date(input.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) throw new ScheduleServiceError('INVALID_SCHEDULE_TIME');
    if (input.quality && !VALID_QUALITIES.includes(input.quality)) throw new ScheduleServiceError('INVALID_QUALITY');
    if (input.format && !VALID_FORMATS.includes(input.format)) throw new ScheduleServiceError('INVALID_FORMAT');
  }

  private isValidYouTubeUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      return ['http:', 'https:'].includes(parsed.protocol) && (host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com'));
    } catch {
      return false;
    }
  }
}
