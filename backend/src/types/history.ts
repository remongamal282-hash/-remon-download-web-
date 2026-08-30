export interface HistoryRecord {
  id: string;
  userId: string;
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

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface HistoryListResponse {
  data: HistoryRecord[];
  pagination: PaginationMeta;
}
