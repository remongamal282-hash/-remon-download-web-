import { createHash, randomBytes, scrypt as scryptCallback, ScryptOptions, timingSafeEqual } from 'node:crypto';
import { AuthSessionRepository } from '../repositories/AuthSessionRepository';
import { UserRecord, UserRepository } from '../repositories/UserRepository';

function scrypt(password: string, salt: string, keyLength: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey as Buffer);
    });
  });
}
const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type AuthErrorCode = 'INVALID_CREDENTIALS' | 'EMAIL_EXISTS' | 'SESSION_INVALID';

export class AuthError extends Error {
  constructor(public readonly code: AuthErrorCode) {
    super(code);
  }
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string | null;
  language: string;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
}

function toPublicUser(user: UserRecord): PublicUser {
  return { id: user.id, email: user.email, displayName: user.displayName, language: user.language };
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }) as Buffer;
  return `scrypt$16384$8$1$${salt}$${derived.toString('hex')}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [, n, r, p, salt, encoded] = stored.split('$');
  if (!n || !r || !p || !salt || !encoded) return false;
  const derived = await scrypt(password, salt, 64, { N: Number(n), r: Number(r), p: Number(p) }) as Buffer;
  const expected = Buffer.from(encoded, 'hex');
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export class AuthService {
  constructor(
    private readonly users = new UserRepository(),
    private readonly sessions = new AuthSessionRepository()
  ) {}

  async register(email: string, password: string, displayName: string | null): Promise<AuthResult> {
    if (await this.users.findByEmail(email)) throw new AuthError('EMAIL_EXISTS');
    try {
      const user = await this.users.create(email, await hashPassword(password), displayName);
      return this.createSession(user);
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as { code?: string }).code === '23505') throw new AuthError('EMAIL_EXISTS');
      throw error;
    }
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.users.findByEmail(email);
    if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) throw new AuthError('INVALID_CREDENTIALS');
    return this.createSession(user);
  }

  async currentUser(accessToken: string | undefined): Promise<PublicUser | null> {
    if (!accessToken) return null;
    const session = await this.sessions.findByAccessHash(tokenHash(accessToken));
    if (!session) return null;
    const user = await this.users.findById(session.userId);
    return user ? toPublicUser(user) : null;
  }

  async refresh(refreshToken: string | undefined): Promise<AuthResult> {
    if (!refreshToken) throw new AuthError('SESSION_INVALID');
    const session = await this.sessions.findByRefreshHash(tokenHash(refreshToken));
    if (!session) throw new AuthError('SESSION_INVALID');
    const user = await this.users.findById(session.userId);
    if (!user) throw new AuthError('SESSION_INVALID');
    return this.createSession(user, session.id);
  }

  async logout(accessToken: string | undefined, refreshToken: string | undefined): Promise<void> {
    if (accessToken) await this.sessions.deleteByAccessHash(tokenHash(accessToken));
    else if (refreshToken) await this.sessions.deleteByRefreshHash(tokenHash(refreshToken));
  }

  private async createSession(user: UserRecord, existingId?: string): Promise<AuthResult> {
    const accessToken = randomBytes(32).toString('base64url');
    const refreshToken = randomBytes(48).toString('base64url');
    const accessExpiresAt = new Date(Date.now() + ACCESS_TTL_MS);
    const refreshExpiresAt = new Date(Date.now() + REFRESH_TTL_MS);
    const session = {
      userId: user.id,
      accessTokenHash: tokenHash(accessToken),
      refreshTokenHash: tokenHash(refreshToken),
      accessExpiresAt,
      refreshExpiresAt,
    };
    if (existingId) await this.sessions.rotate(existingId, session);
    else await this.sessions.create(session);
    return { user: toPublicUser(user), accessToken, refreshToken, accessExpiresAt, refreshExpiresAt };
  }
}