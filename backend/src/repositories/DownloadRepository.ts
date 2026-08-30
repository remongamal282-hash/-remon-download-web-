import { pool } from '../database';
import { CreateDownloadInput, DownloadRecord, DownloadStatus } from '../types/download';

const columns = `id, user_id AS "userId", url, title, thumbnail_url AS "thumbnailUrl", media_type AS "mediaType", quality, format, status, progress::float8 AS progress, file_path AS "filePath", file_size AS "fileSize", duration::float8 AS duration, error_message AS "errorMessage", created_at AS "createdAt", updated_at AS "updatedAt"`;

export class DownloadRepository {
  async create(userId: string, input: CreateDownloadInput): Promise<DownloadRecord> {
    const result = await pool.query(`INSERT INTO downloads (user_id, url, quality, format, media_type) VALUES ($1, $2, $3, $4, 'video') RETURNING ${columns}`, [userId, input.url, input.quality, input.format]);
    return result.rows[0];
  }
  async findByIdForUser(id: string, userId: string): Promise<DownloadRecord | null> {
    const result = await pool.query(`SELECT ${columns} FROM downloads WHERE id = $1 AND user_id = $2`, [id, userId]); return result.rows[0] || null;
  }
  async listForUser(userId: string): Promise<DownloadRecord[]> {
    const result = await pool.query(`SELECT ${columns} FROM downloads WHERE user_id = $1 ORDER BY created_at DESC`, [userId]); return result.rows;
  }
  async updateStatus(id: string, status: DownloadStatus, errorMessage: string | null = null): Promise<void> { await pool.query('UPDATE downloads SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3', [status, errorMessage, id]); }
  async updateProgress(id: string, progress: number, fileSize: number | null, filePath: string | null = null): Promise<void> { await pool.query('UPDATE downloads SET progress = $1, file_size = $2, file_path = COALESCE($3, file_path), updated_at = NOW() WHERE id = $4', [progress, fileSize, filePath, id]); }
}