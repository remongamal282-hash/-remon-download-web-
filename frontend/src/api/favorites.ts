/**
 * Favorites API for Phase 8.
 */
import { apiClient } from './client';

export interface FavoriteItem {
  id: string;
  url: string;
  title: string | null;
  thumbnailUrl: string | null;
  mediaType: string | null;
  duration: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface FavoritesListResponse {
  data: FavoriteItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getFavorites(page: number = 1, limit: number = 20, search?: string): Promise<FavoritesListResponse> {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (search) params.append('search', search);
  const response = await apiClient.get<{ success: true; data: FavoriteItem[]; pagination: FavoritesListResponse['pagination'] }>(`/favorites?${params.toString()}`);
  return { data: response.data, pagination: response.pagination! };
}

export async function getFavorite(id: string): Promise<FavoriteItem> {
  const response = await apiClient.get<{ success: true; data: FavoriteItem }>(`/favorites/${id}`);
  return response.data;
}

export async function addFavorite(payload: { url: string; title?: string | null; thumbnailUrl?: string | null; mediaType?: string | null; duration?: number | null }): Promise<FavoriteItem> {
  const response = await apiClient.post<{ success: true; data: FavoriteItem }>('/favorites', payload);
  return response.data;
}

export async function deleteFavorite(id: string): Promise<void> {
  await apiClient.delete(`/favorites/${id}`);
}

export async function downloadFromFavorite(id: string, options?: { quality?: string; format?: string }): Promise<{ downloadId: string }> {
  const response = await apiClient.post<{ success: true; data: { downloadId: string } }>(`/favorites/${id}/download`, options || {});
  return response.data;
}
