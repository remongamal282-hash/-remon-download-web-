import assert from 'node:assert/strict';
import test from 'node:test';
import { DownloadEngine } from '../src/engine/downloadEngine';
import { DownloadQueue } from '../src/queue/downloadQueue';
import { DownloadRepository } from '../src/repositories/DownloadRepository';
import { DownloadService } from '../src/services/downloadService';
import { DownloadRecord } from '../src/types/download';
import { buildApp } from '../src/app';
import { AuthService, PublicUser } from '../src/services/authService';

const base: DownloadRecord = { id: 'download-1', userId: 'user-1', url: 'https://youtu.be/abc', title: null, thumbnailUrl: null, mediaType: 'video', quality: '720p', format: '137', status: 'queued', progress: 0, filePath: null, fileSize: null, duration: null, errorMessage: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

class FakeRepository implements Partial<DownloadRepository> {
  records = new Map([[base.id, { ...base }]]);
  async create(userId: string, input: { url: string; format: string; quality: string; outputFormat: string }) { const record = { ...base, userId, url: input.url, format: input.format, quality: input.quality }; this.records.set(record.id, record); return record; }
  async findByIdForUser(id: string, userId: string) { const record = this.records.get(id); return record?.userId === userId ? record : null; }
  async listForUser(userId: string) { return [...this.records.values()].filter((record) => record.userId === userId); }
  async updateStatus(id: string, status: DownloadRecord['status'], errorMessage: string | null = null) { const record = this.records.get(id); if (record) { record.status = status; record.errorMessage = errorMessage; } }
  async updateProgress(id: string, progress: number, fileSize: number | null, filePath: string | null = null) { const record = this.records.get(id); if (record) { record.progress = progress; record.fileSize = fileSize; record.filePath = filePath; } }
}

class FakeEngine {
  calls: string[] = [];
  async start(record: DownloadRecord, hooks: { state: (status: DownloadRecord['status']) => Promise<void>; progress: (progress: number) => Promise<void> }) { this.calls.push(`start:${record.id}`); await hooks.state('analyzing'); await hooks.state('downloading'); await hooks.progress(100); await hooks.state('completed'); return { filePath: `C:\\downloads\\${record.id}.mp4`, fileSize: 1234 }; }
  pause(id: string) { this.calls.push(`pause:${id}`); }
  resume(id: string) { this.calls.push(`resume:${id}`); }
  stop(id: string) { this.calls.push(`stop:${id}`); }
  cancel(id: string) { this.calls.push(`cancel:${id}`); }
  async cleanup(id: string) { this.calls.push(`cleanup:${id}`); }
}

test('queue enforces its concurrency limit', async () => {
  const queue = new DownloadQueue(2); let active = 0; let peak = 0; let release!: () => void;
  const blocker = new Promise<void>((resolve) => { release = resolve; });
  for (let index = 0; index < 4; index += 1) queue.add({ id: String(index), run: async () => { active += 1; peak = Math.max(peak, active); await blocker; active -= 1; } });
  await new Promise((resolve) => setImmediate(resolve)); assert.equal(peak, 2); release(); await new Promise((resolve) => setImmediate(resolve));
});

test('download service validates ownership, URL, lifecycle actions, and async creation', async () => {
  const repository = new FakeRepository(); const engine = new FakeEngine(); const service = new DownloadService(repository as DownloadRepository, engine as unknown as DownloadEngine, new DownloadQueue(1));
  await assert.rejects(() => service.get('other-user', base.id), (error: Error) => error.message === 'DOWNLOAD_NOT_FOUND');
  const canceled = await service.cancel('user-1', base.id); assert.equal(canceled.status, 'canceled'); assert.ok(engine.calls.includes('cancel:download-1'));
  const created = await service.create('user-1', { url: base.url, format: '137', quality: '720p', outputFormat: 'mp4' }); assert.equal(created.id, base.id); assert.ok(['queued', 'analyzing', 'downloading', 'completed'].includes(created.status));
  await assert.rejects(() => service.create('user-1', { url: 'https://example.com/file', format: '137', quality: '720p', outputFormat: 'mp4' }), (error: Error) => error.message === 'INVALID_URL');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(repository.records.get(base.id)?.filePath, `C:\\downloads\\${base.id}.mp4`);
  assert.equal(repository.records.get(base.id)?.fileSize, 1234);
});

test('download API requires auth and enforces ownership', async () => {
  const auth = { currentUser: async (token?: string) => token === 'valid' ? ({ id: 'user-1', email: 'x@y.test', displayName: null, language: 'en' } as PublicUser) : null } as unknown as AuthService;
  const repository = new FakeRepository(); const service = new DownloadService(repository as DownloadRepository, new FakeEngine() as unknown as DownloadEngine, new DownloadQueue());
  const app = await buildApp({ databaseHealthCheck: async () => true, authService: auth, downloadService: service });
  try { assert.equal((await app.inject({ method: 'GET', url: '/api/downloads' })).statusCode, 401); const response = await app.inject({ method: 'GET', url: '/api/downloads/download-1', headers: { cookie: 'remon_access=valid' } }); assert.equal(response.statusCode, 200); } finally { await app.close(); }
});