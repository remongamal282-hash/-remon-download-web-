/**
 * History API for Phase 8.
 */
import { apiClient } from './client';

export interface HistoryItem {
  id: string;
  downloadId: string | null;
  url: string;
  title: string | null;
  thumbnailUrl: string | null;
  mediaType: string | null;
  quality: string | null;
  format: string | null;
  fileSize: number | null;
  duration: number | null;
  completedAt: string | null;
  createdAt: string;
}

export interface HistoryListResponse {
  data: HistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getHistory(page: number = 1, limit: number = 20, search?: string): Promise<HistoryListResponse> {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (search) params.append('search', search);
  const response = await apiClient.get<{ success: true; data: HistoryItem[]; pagination: HistoryListResponse['pagination'] }>(`/history?${params.toString()}`);
  return { data: response.data, pagination: response.pagination! };
}

export async function getHistoryItem(id: string): Promise<HistoryItem> {
  const response = await apiClient.get<{ success: true; data: HistoryItem }>(`/history/${id}`);
  return response.data;
}

export async function deleteHistoryItem(id: string): Promise<void> {
  await apiClient.delete(`/history/${id}`);
}

export async function redownloadFromHistory(id: string): Promise<{ downloadId: string }> {
  const response = await apiClient.post<{ success: true; data: { downloadId: string } }>(`/history/${id}/redownload`, {});
  return response.data;
}

export async function redownloadHistoryItem(id: string): Promise<void> {
  return apiClient.post<void>(`/history/${id}/redownload`, {});
}
