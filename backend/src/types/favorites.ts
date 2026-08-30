export interface FavoriteRecord {
  id: string;
  userId: string;
  url: string;
  title: string | null;
  thumbnailUrl: string | null;
  mediaType: string | null;
  duration: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FavoritesListResponse {
  data: FavoriteRecord[];
  pagination: PaginationMeta;
}
