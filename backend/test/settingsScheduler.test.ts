import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { buildApp } from '../src/app';
import { pool } from '../src/database';
import { SettingsService, SettingsServiceError } from '../src/services/settingsService';
import { SchedulerService, ScheduleServiceError } from '../src/services/schedulerService';
import { AuthService, PublicUser } from '../src/services/authService';
import { DownloadService } from '../src/services/downloadService';

const makeUser = (suffix?: string): PublicUser => {
  const nextSuffix = suffix ?? randomUUID().slice(0, 12).replace(/-/g, '');
  return {
    id: `11111111-1111-4111-8111-${nextSuffix.padStart(12, '0')}`,
    email: `test-${nextSuffix}@example.com`,
    displayName: null,
    language: 'en',
  };
};

const user = makeUser('000000000001');
const fakeAuth = { currentUser: async (token?: string) => (token === 'valid' ? user : null) } as unknown as AuthService;

test('settings service returns safe defaults and validates updates', async () => {
  const localUser = makeUser();
  await pool.query(`INSERT INTO users (id, email, password_hash, display_name, language) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`, [localUser.id, localUser.email, 'hash', null, 'en']);
  const service = new SettingsService();
  const defaults = await service.getOrCreate(localUser.id);
  assert.equal(defaults.defaultQuality, 'best');
  assert.equal(defaults.defaultFormat, 'mp4');
  assert.equal(defaults.concurrentDownloads, 3);
  assert.equal(defaults.language, 'en');

  await assert.rejects(() => service.update(localUser.id, { defaultQuality: 'invalid' } as any), (error: Error) => error instanceof SettingsServiceError && error.code === 'INVALID_QUALITY');
  await assert.rejects(() => service.update(localUser.id, { concurrentDownloads: 0 } as any), (error: Error) => error instanceof SettingsServiceError && error.code === 'INVALID_CONCURRENCY');

  const updated = await service.update(localUser.id, { defaultQuality: '1080p', defaultFormat: 'mp4', concurrentDownloads: 2, language: 'ar', theme: 'light' });
  assert.equal(updated.defaultQuality, '1080p');
  assert.equal(updated.language, 'ar');
  assert.equal(updated.theme, 'light');
});

test('settings API requires auth and enforces ownership', async () => {
  const localUser = makeUser();
  await pool.query(`INSERT INTO users (id, email, password_hash, display_name, language) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`, [localUser.id, localUser.email, 'hash', null, 'en']);
  const app = await buildApp({ databaseHealthCheck: async () => true, authService: { currentUser: async (token?: string) => (token === 'valid' ? localUser : null) } as unknown as AuthService, settingsService: new SettingsService() });
  try {
    const unauth = await app.inject({ method: 'GET', url: '/api/settings' });
    assert.equal(unauth.statusCode, 401);

    const ok = await app.inject({ method: 'GET', url: '/api/settings', headers: { cookie: 'remon_access=valid' } });
    assert.equal(ok.statusCode, 200);
    assert.equal(ok.json().success, true);
  } finally {
    await app.close();
  }
});

test('scheduler service executes due schedules once and skips invalid payloads', async () => {
  const created: string[] = [];
  const localUser = makeUser();
  const service = new SchedulerService({
    repository: {
      listDue: async () => [{
        id: 'schedule-1',
        userId: localUser.id,
        url: 'https://youtu.be/abc123',
        title: null,
        thumbnailUrl: null,
        mediaType: 'video',
        quality: '720p',
        format: 'mp4',
        scheduledAt: new Date(Date.now() - 1000).toISOString(),
        enabled: true,
        status: 'queued',
        lastRunAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }],
      markActive: async () => ({ id: 'schedule-1', status: 'active' }),
      markCompleted: async (id) => { created.push(id); return { id, status: 'completed' }; },
      markFailed: async () => undefined,
      findByIdForUser: async () => null,
      create: async () => ({ id: 'schedule-1' } as any),
      listForUser: async () => [],
      update: async () => ({ id: 'schedule-1' } as any),
      delete: async () => true,
      setEnabled: async () => ({ id: 'schedule-1' } as any),
    },
    downloadService: {
      create: async (targetUserId: string, input: any) => {
        assert.equal(targetUserId, localUser.id);
        assert.equal(input.url, 'https://youtu.be/abc123');
        return { id: 'download-1', status: 'queued' } as any;
      },
    } as unknown as DownloadService,
  });

  await service.runDueSchedules();
  assert.deepEqual(created, ['schedule-1']);

  await assert.rejects(() => service.create(localUser.id, { url: 'https://example.com/not-youtube', scheduledAt: new Date().toISOString(), quality: '720p', format: 'mp4' } as any), (error: Error) => error instanceof ScheduleServiceError && error.code === 'INVALID_URL');
});
