import { pool } from '../database';
import { FavoriteRecord } from '../types/favorites';

const columns = `id, user_id AS "userId", url, title, thumbnail_url AS "thumbnailUrl", media_type AS "mediaType", duration::float8 AS duration, created_at AS "createdAt", updated_at AS "updatedAt"`;

export class FavoriteRepository {
  async listForUser(userId: string, page: number, limit: number, search?: string): Promise<{ records: FavoriteRecord[]; total: number }> {
    const offset = (page - 1) * limit;
    let query = `SELECT ${columns} FROM favorites WHERE user_id = $1`;
    const params: unknown[] = [userId];
    let paramCount = 2;

    if (search) {
      query += ` AND (title ILIKE $${paramCount} OR url ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    const countResult = await pool.query(`SELECT COUNT(*) as count FROM favorites WHERE user_id = $1${search ? ` AND (title ILIKE $2 OR url ILIKE $2)` : ''}`, search ? [userId, `%${search}%`] : [userId]);
    const total = parseInt(countResult.rows[0].count, 10);

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return { records: result.rows, total };
  }

  async findByIdForUser(id: string, userId: string): Promise<FavoriteRecord | null> {
    const result = await pool.query(`SELECT ${columns} FROM favorites WHERE id = $1 AND user_id = $2`, [id, userId]);
    return result.rows[0] || null;
  }

  async findByUrlForUser(url: string, userId: string): Promise<FavoriteRecord | null> {
    const result = await pool.query(`SELECT ${columns} FROM favorites WHERE url = $1 AND user_id = $2`, [url, userId]);
    return result.rows[0] || null;
  }

  async create(userId: string, data: { url: string; title?: string | null; thumbnailUrl?: string | null; mediaType?: string | null; duration?: number | null }): Promise<FavoriteRecord> {
    const result = await pool.query(`INSERT INTO favorites (user_id, url, title, thumbnail_url, media_type, duration) VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${columns}`, [userId, data.url, data.title || null, data.thumbnailUrl || null, data.mediaType || null, data.duration || null]);
    return result.rows[0];
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM favorites WHERE id = $1 AND user_id = $2', [id, userId]);
    return (result.rowCount ?? 0) > 0;
  }
}