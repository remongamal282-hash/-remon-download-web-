/** Scheduler API — stub for Phase 8 */
import { apiClient } from './client';

export interface Schedule {
  id: string;
  url: string;
  quality: string;
  format: string;
  scheduledAt: string;
  enabled: boolean;
  createdAt: string;
}

export async function getSchedules(): Promise<Schedule[]> {
  return apiClient.get<Schedule[]>('/schedules');
}

export async function createSchedule(payload: Omit<Schedule, 'id' | 'createdAt'>): Promise<Schedule> {
  return apiClient.post<Schedule>('/schedules', payload);
}

export async function updateSchedule(id: string, patch: Partial<Schedule>): Promise<Schedule> {
  return apiClient.patch<Schedule>(`/schedules/${id}`, patch);
}

export async function deleteSchedule(id: string): Promise<void> {
  return apiClient.delete<void>(`/schedules/${id}`);
}
