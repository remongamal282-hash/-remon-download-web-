import { pool } from '../database';
import { SettingsInput, SettingsRecord } from '../types/settings';

const columns = `id, user_id AS "userId", download_path AS "downloadPath", default_quality AS "defaultQuality", default_format AS "defaultFormat", language, theme, notifications_enabled AS "notificationsEnabled", concurrent_downloads AS "concurrentDownloads", created_at AS "createdAt", updated_at AS "updatedAt"`;

export class SettingsRepository {
  async findByUserId(userId: string): Promise<SettingsRecord | null> {
    const result = await pool.query(`SELECT ${columns} FROM settings WHERE user_id = $1`, [userId]);
    return result.rows[0] || null;
  }

  async create(userId: string, input: SettingsInput): Promise<SettingsRecord> {
    const result = await pool.query(
      `INSERT INTO settings (user_id, default_quality, default_format, language, theme, notifications_enabled, concurrent_downloads, download_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ${columns}`,
      [userId, input.defaultQuality ?? 'best', input.defaultFormat ?? 'mp4', input.language ?? 'en', input.theme ?? 'light', input.notificationsEnabled ?? true, input.concurrentDownloads ?? 3, input.downloadPath ?? null]
    );
    return result.rows[0];
  }

  async update(userId: string, input: SettingsInput): Promise<SettingsRecord | null> {
    const current = await this.findByUserId(userId);
    if (!current) return null;

    const next = {
      defaultQuality: input.defaultQuality ?? current.defaultQuality,
      defaultFormat: input.defaultFormat ?? current.defaultFormat,
      language: input.language ?? current.language,
      theme: input.theme ?? current.theme,
      notificationsEnabled: input.notificationsEnabled ?? current.notificationsEnabled,
      concurrentDownloads: input.concurrentDownloads ?? current.concurrentDownloads,
      downloadPath: input.downloadPath ?? current.downloadPath,
    };

    const result = await pool.query(
      `UPDATE settings
       SET default_quality = $2, default_format = $3, language = $4, theme = $5, notifications_enabled = $6,
           concurrent_downloads = $7, download_path = $8, updated_at = NOW()
       WHERE user_id = $1
       RETURNING ${columns}`,
      [userId, next.defaultQuality, next.defaultFormat, next.language, next.theme, next.notificationsEnabled, next.concurrentDownloads, next.downloadPath]
    );

    return result.rows[0] || null;
  }
}
