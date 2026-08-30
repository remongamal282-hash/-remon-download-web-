import { pool } from '../database';

export interface AuthSessionRecord {
  id: string;
  userId: string;
  accessTokenHash: string;
  refreshTokenHash: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
}

export class AuthSessionRepository {
  async create(session: Omit<AuthSessionRecord, 'id'>): Promise<void> {
    await pool.query('INSERT INTO auth_sessions (user_id, access_token_hash, refresh_token_hash, access_expires_at, refresh_expires_at) VALUES ($1, $2, $3, $4, $5)', [session.userId, session.accessTokenHash, session.refreshTokenHash, session.accessExpiresAt, session.refreshExpiresAt]);
  }

  async findByAccessHash(hash: string): Promise<AuthSessionRecord | null> {
    const result = await pool.query('SELECT id, user_id AS "userId", access_token_hash AS "accessTokenHash", refresh_token_hash AS "refreshTokenHash", access_expires_at AS "accessExpiresAt", refresh_expires_at AS "refreshExpiresAt" FROM auth_sessions WHERE access_token_hash = $1 AND access_expires_at > NOW()', [hash]);
    return result.rows[0] || null;
  }

  async findByRefreshHash(hash: string): Promise<AuthSessionRecord | null> {
    const result = await pool.query('SELECT id, user_id AS "userId", access_token_hash AS "accessTokenHash", refresh_token_hash AS "refreshTokenHash", access_expires_at AS "accessExpiresAt", refresh_expires_at AS "refreshExpiresAt" FROM auth_sessions WHERE refresh_token_hash = $1 AND refresh_expires_at > NOW()', [hash]);
    return result.rows[0] || null;
  }

  async rotate(id: string, session: Omit<AuthSessionRecord, 'id'>): Promise<void> {
    await pool.query('UPDATE auth_sessions SET access_token_hash = $1, refresh_token_hash = $2, access_expires_at = $3, refresh_expires_at = $4 WHERE id = $5', [session.accessTokenHash, session.refreshTokenHash, session.accessExpiresAt, session.refreshExpiresAt, id]);
  }

  async deleteByAccessHash(hash: string): Promise<void> {
    await pool.query('DELETE FROM auth_sessions WHERE access_token_hash = $1', [hash]);
  }

  async deleteByRefreshHash(hash: string): Promise<void> {
    await pool.query('DELETE FROM auth_sessions WHERE refresh_token_hash = $1', [hash]);
  }
}