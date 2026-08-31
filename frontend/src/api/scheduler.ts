import { apiClient } from './client';

export interface Schedule {
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
  status: 'queued' | 'active' | 'completed' | 'failed' | 'canceled';
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getSchedules(): Promise<Schedule[]> {
  const response = await apiClient.get<{ success: true; data: Schedule[] }>('/scheduler');
  return response.data;
}

export async function createSchedule(payload: {
  url: string;
  scheduledAt: string;
  quality?: string;
  format?: string;
  enabled?: boolean;
}): Promise<Schedule> {
  const response = await apiClient.post<{ success: true; data: Schedule }>('/scheduler', payload);
  return response.data;
}

export async function updateSchedule(id: string, patch: Partial<Schedule>): Promise<Schedule> {
  const response = await apiClient.put<{ success: true; data: Schedule }>(`/scheduler/${id}`, patch);
  return response.data;
}

export async function deleteSchedule(id: string): Promise<void> {
  await apiClient.delete<{ success: true; data: { id: string } }>(`/scheduler/${id}`);
}

export async function toggleSchedule(id: string, enabled: boolean): Promise<Schedule> {
  const response = await apiClient.post<{ success: true; data: Schedule }>(`/scheduler/${id}/${enabled ? 'enable' : 'disable'}`, {});
  return response.data;
}
