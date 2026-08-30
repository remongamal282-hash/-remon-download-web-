export type DownloadStatus = 'queued' | 'analyzing' | 'downloading' | 'paused' | 'merging' | 'converting' | 'completed' | 'failed' | 'canceled' | 'retrying';

export interface DownloadRecord {
  id: string;
  userId: string;
  url: string;
  title: string | null;
  thumbnailUrl: string | null;
  mediaType: string | null;
  quality: string | null;
  format: string | null;
  status: DownloadStatus;
  progress: number;
  filePath: string | null;
  fileSize: number | null;
  duration: number | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDownloadInput {
  url: string;
  format: string;
  quality: string;
  outputFormat: string;
}

export const DOWNLOAD_TRANSITIONS: Record<DownloadStatus, DownloadStatus[]> = {
  queued: ['analyzing', 'canceled'], analyzing: ['downloading', 'failed', 'canceled'], downloading: ['paused', 'merging', 'failed', 'canceled'], paused: ['downloading', 'canceled'], merging: ['converting', 'completed', 'failed'], converting: ['completed', 'failed'], retrying: ['analyzing'], completed: [], failed: ['retrying'], canceled: [],
};