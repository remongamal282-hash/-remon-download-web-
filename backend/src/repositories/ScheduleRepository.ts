import { pool } from '../database';
import { ScheduleInput, ScheduleRecord } from '../types/scheduler';

const columns = `id, user_id AS "userId", url, title, thumbnail_url AS "thumbnailUrl", media_type AS "mediaType", quality, format, scheduled_at AS "scheduledAt", enabled, status, last_run_at AS "lastRunAt", created_at AS "createdAt", updated_at AS "updatedAt"`;

export class ScheduleRepository {
  async create(userId: string, input: ScheduleInput): Promise<ScheduleRecord> {
    const result = await pool.query(
      `INSERT INTO schedules (user_id, url, title, thumbnail_url, media_type, quality, format, scheduled_at, enabled, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'queued')
       RETURNING ${columns}`,
      [userId, input.url, input.title ?? null, input.thumbnailUrl ?? null, input.mediaType ?? null, input.quality ?? null, input.format ?? null, input.scheduledAt, input.enabled ?? true]
    );
    return result.rows[0];
  }

  async findByIdForUser(id: string, userId: string): Promise<ScheduleRecord | null> {
    const result = await pool.query(`SELECT ${columns} FROM schedules WHERE id = $1 AND user_id = $2`, [id, userId]);
    return result.rows[0] || null;
  }

  async listForUser(userId: string): Promise<ScheduleRecord[]> {
    const result = await pool.query(`SELECT ${columns} FROM schedules WHERE user_id = $1 ORDER BY scheduled_at DESC, created_at DESC`, [userId]);
    return result.rows;
  }

  async update(id: string, userId: string, input: Partial<ScheduleInput>): Promise<ScheduleRecord | null> {
    const existing = await this.findByIdForUser(id, userId);
    if (!existing) return null;

    const next = {
      url: input.url ?? existing.url,
      title: input.title ?? existing.title,
      thumbnailUrl: input.thumbnailUrl ?? existing.thumbnailUrl,
      mediaType: input.mediaType ?? existing.mediaType,
      quality: input.quality ?? existing.quality,
      format: input.format ?? existing.format,
      scheduledAt: input.scheduledAt ?? existing.scheduledAt,
      enabled: input.enabled ?? existing.enabled,
    };

    const result = await pool.query(
      `UPDATE schedules
       SET url = $3, title = $4, thumbnail_url = $5, media_type = $6, quality = $7, format = $8,
           scheduled_at = $9, enabled = $10, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING ${columns}`,
      [id, userId, next.url, next.title, next.thumbnailUrl, next.mediaType, next.quality, next.format, next.scheduledAt, next.enabled]
    );
    return result.rows[0] || null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM schedules WHERE id = $1 AND user_id = $2', [id, userId]);
    return (result.rowCount ?? 0) > 0;
  }

  async setEnabled(id: string, userId: string, enabled: boolean): Promise<ScheduleRecord | null> {
    const result = await pool.query(
      `UPDATE schedules SET enabled = $3, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING ${columns}`,
      [id, userId, enabled]
    );
    return result.rows[0] || null;
  }

  async listDue(): Promise<ScheduleRecord[]> {
    const result = await pool.query(`SELECT ${columns} FROM schedules WHERE enabled = TRUE AND status = 'queued' AND scheduled_at <= NOW() ORDER BY scheduled_at ASC LIMIT 50`);
    return result.rows;
  }

  async markActive(id: string): Promise<ScheduleRecord | null> {
    const result = await pool.query(`UPDATE schedules SET status = 'active', updated_at = NOW() WHERE id = $1 RETURNING ${columns}`, [id]);
    return result.rows[0] || null;
  }

  async markCompleted(id: string): Promise<ScheduleRecord | null> {
    const result = await pool.query(`UPDATE schedules SET status = 'completed', last_run_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING ${columns}`, [id]);
    return result.rows[0] || null;
  }

  async markFailed(id: string): Promise<ScheduleRecord | null> {
    const result = await pool.query(`UPDATE schedules SET status = 'failed', updated_at = NOW() WHERE id = $1 RETURNING ${columns}`, [id]);
    return result.rows[0] || null;
  }
}
