import assert from 'node:assert/strict';
import test from 'node:test';
import { buildApp } from '../src/app';
import { AuthResult, AuthService, PublicUser } from '../src/services/authService';

const user: PublicUser = { id: 'user-1', email: 'test@example.com', displayName: null, language: 'en' };
const result: AuthResult = {
  user,
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  accessExpiresAt: new Date(),
  refreshExpiresAt: new Date(),
};

function fakeAuthService(): AuthService {
  return {
    register: async () => result,
    login: async () => result,
    currentUser: async (token) => token === result.accessToken ? user : null,
    refresh: async () => result,
    logout: async () => undefined,
  } as unknown as AuthService;
}

test('register and login set http-only cookies without returning tokens', async () => {
  const app = await buildApp({ databaseHealthCheck: async () => true, authService: fakeAuthService() });
  try {
    const register = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { email: 'test@example.com', password: 'password123', passwordConfirmation: 'password123' } });
    assert.equal(register.statusCode, 201);
    assert.deepEqual(register.json(), { success: true, data: { user } });
    assert.match(register.headers['set-cookie']?.toString() || '', /HttpOnly/);

    const login = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'test@example.com', password: 'password123' } });
    assert.equal(login.statusCode, 200);
    assert.equal(JSON.stringify(login.json()).includes('accessToken'), false);
  } finally { await app.close(); }
});

test('invalid registration input and password mismatch are rejected', async () => {
  const app = await buildApp({ databaseHealthCheck: async () => true, authService: fakeAuthService() });
  try {
    const invalid = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { email: 'bad', password: 'short' } });
    assert.equal(invalid.statusCode, 400);
    const mismatch = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { email: 'test@example.com', password: 'password123', passwordConfirmation: 'different123' } });
    assert.equal(mismatch.statusCode, 400);
  } finally { await app.close(); }
});

test('me requires authentication and logout clears cookies', async () => {
  const app = await buildApp({ databaseHealthCheck: async () => true, authService: fakeAuthService() });
  try {
    const unauthenticated = await app.inject({ method: 'GET', url: '/api/auth/me' });
    assert.equal(unauthenticated.statusCode, 401);
    const authenticated = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie: 'remon_access=access-token' } });
    assert.equal(authenticated.statusCode, 200);
    assert.deepEqual(authenticated.json(), { success: true, data: { user } });
    const logout = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { cookie: 'remon_access=access-token' } });
    assert.equal(logout.statusCode, 200);
    assert.match(logout.headers['set-cookie']?.toString() || '', /Max-Age=0/);
  } finally { await app.close(); }
});