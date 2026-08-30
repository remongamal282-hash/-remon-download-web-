import assert from 'node:assert/strict';
import test from 'node:test';
import { buildApp } from '../src/app';

test('health returns ok when the database is available', async () => {
  const app = await buildApp({ databaseHealthCheck: async () => true });

  try {
    const response = await app.inject({ method: 'GET', url: '/api/health' });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { status: 'ok', database: 'ok' });
  } finally {
    await app.close();
  }
});

test('health returns 503 when the database is unavailable', async () => {
  const app = await buildApp({ databaseHealthCheck: async () => false });

  try {
    const response = await app.inject({ method: 'GET', url: '/api/health' });

    assert.equal(response.statusCode, 503);
    assert.deepEqual(response.json(), { status: 'ok', database: 'error' });
  } finally {
    await app.close();
  }
});

test('unknown routes return the standard not found response', async () => {
  const app = await buildApp({ databaseHealthCheck: async () => true });

  try {
    const response = await app.inject({ method: 'GET', url: '/api/does-not-exist' });

    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.json(), {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  } finally {
    await app.close();
  }
});