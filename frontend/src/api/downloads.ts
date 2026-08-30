/**
 * Download API for Phase 7.
 */
import { apiClient } from './client';

export interface DownloadJob {
  id: string;
  url: string;
  title: string | null;
  thumbnailUrl: string | null;
  quality: string | null;
  format: string | null;
  outputFormat: string;
  status: 'queued' | 'analyzing' | 'downloading' | 'paused' | 'merging' | 'converting' | 'completed' | 'failed' | 'canceled' | 'retrying';
  progress: number;
  errorMessage: string | null;
  filePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDownloadPayload {
  url: string;
  quality: string;
  format: string;
  outputFormat: 'mp4' | 'webm' | 'mp3';
}

export async function createDownload(payload: CreateDownloadPayload): Promise<DownloadJob> {
  const response = await apiClient.post<{ success: true; data: DownloadJob }>('/downloads', payload);
  return response.data;
}

export async function getDownloads(): Promise<DownloadJob[]> {
  const response = await apiClient.get<{ success: true; data: DownloadJob[] }>('/downloads'); return response.data;
}

export async function getDownload(id: string): Promise<DownloadJob> {
  const response = await apiClient.get<{ success: true; data: DownloadJob }>(`/downloads/${id}`); return response.data;
}

export async function cancelDownload(id: string): Promise<void> {
  await apiClient.post(`/downloads/${id}/cancel`, {});
}

export async function controlDownload(id: string, action: 'pause' | 'resume' | 'stop' | 'retry'): Promise<DownloadJob> {
  const response = await apiClient.post<{ success: true; data: DownloadJob }>(`/downloads/${id}/${action}`, {}); return response.data;
}
