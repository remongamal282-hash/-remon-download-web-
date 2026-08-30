import { pool } from '../database';

export interface UserRecord {
	id: string;
	email: string;
	passwordHash: string | null;
	displayName: string | null;
	language: string;
}

export class UserRepository {
	async findByEmail(email: string): Promise<UserRecord | null> {
		const result = await pool.query('SELECT id, email, password_hash AS "passwordHash", display_name AS "displayName", language FROM users WHERE email = $1', [email]);
		return result.rows[0] || null;
	}

	async findById(id: string): Promise<UserRecord | null> {
		const result = await pool.query('SELECT id, email, password_hash AS "passwordHash", display_name AS "displayName", language FROM users WHERE id = $1', [id]);
		return result.rows[0] || null;
	}

	async create(email: string, passwordHash: string, displayName: string | null): Promise<UserRecord> {
		const result = await pool.query('INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, password_hash AS "passwordHash", display_name AS "displayName", language', [email, passwordHash, displayName]);
		return result.rows[0];
	}
}