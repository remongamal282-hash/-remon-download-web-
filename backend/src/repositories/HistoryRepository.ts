import { pool } from '../database';
import { HistoryRecord } from '../types/history';

const columns = `id, user_id AS "userId", download_id AS "downloadId", url, title, thumbnail_url AS "thumbnailUrl", media_type AS "mediaType", quality, format, file_size AS "fileSize", duration::float8 AS duration, completed_at AS "completedAt", created_at AS "createdAt"`;

export class HistoryRepository {
  async listForUser(userId: string, page: number, limit: number, search?: string): Promise<{ records: HistoryRecord[]; total: number }> {
    const offset = (page - 1) * limit;
    let query = `SELECT ${columns} FROM history WHERE user_id = $1`;
    const params: unknown[] = [userId];
    let paramCount = 2;

    if (search) {
      query += ` AND (title ILIKE $${paramCount} OR url ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    const countResult = await pool.query(`SELECT COUNT(*) as count FROM history WHERE user_id = $1${search ? ` AND (title ILIKE $2 OR url ILIKE $2)` : ''}`, search ? [userId, `%${search}%`] : [userId]);
    const total = parseInt(countResult.rows[0].count, 10);

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return { records: result.rows, total };
  }

  async findByIdForUser(id: string, userId: string): Promise<HistoryRecord | null> {
    const result = await pool.query(`SELECT ${columns} FROM history WHERE id = $1 AND user_id = $2`, [id, userId]);
    return result.rows[0] || null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM history WHERE id = $1 AND user_id = $2', [id, userId]);
    return (result.rowCount ?? 0) > 0;
  }
}