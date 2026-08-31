export type ScheduleStatus = 'queued' | 'active' | 'completed' | 'failed' | 'canceled';

export interface ScheduleRecord {
  id: string;
  userId: string;
  url: string;
  title: string | null;
  thumbnailUrl: string | null;
  mediaType: string | null;
  quality: string | null;
  format: string | null;
  scheduledAt: string;
  enabled: boolean;
  status: ScheduleStatus;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleInput {
  url: string;
  scheduledAt: string;
  quality?: string;
  format?: string;
  enabled?: boolean;
  title?: string | null;
  thumbnailUrl?: string | null;
  mediaType?: string | null;
}
