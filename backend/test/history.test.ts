import assert from 'node:assert/strict';
import test from 'node:test';
import { HistoryRepository } from '../src/repositories/HistoryRepository';
import { HistoryService, HistoryServiceError } from '../src/services/historyService';
import { HistoryRecord } from '../src/types/history';
import { buildApp } from '../src/app';
import { AuthService, PublicUser } from '../src/services/authService';
import { DownloadService } from '../src/services/downloadService';
import { DownloadRecord } from '../src/types/download';

class FakeHistoryRepository implements Partial<HistoryRepository> {
  records = new Map<string, HistoryRecord>();

  async listForUser(userId: string, page: number, limit: number, search?: string) {
    const records = [...this.records.values()].filter((r) => r.userId === userId);
    if (search) {
      records.splice(0, records.length, ...records.filter((r) => r.title?.includes(search) || r.url.includes(search)));
    }
    const sorted = records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const offset = (page - 1) * limit;
    return { records: sorted.slice(offset, offset + limit), total: sorted.length };
  }

  async findByIdForUser(id: string, userId: string) {
    const record = this.records.get(id);
    return record?.userId === userId ? record : null;
  }

  async delete(id: string, userId: string) {
    const record = this.records.get(id);
    if (record?.userId === userId) {
      this.records.delete(id);
      return true;
    }
    return false;
  }
}

class FakeDownloadService {
  async create(userId: string, input: unknown) {
    return { id: 'new-download-1', userId, status: 'queued' } as unknown as DownloadRecord;
  }
}

const historyRecord1: HistoryRecord = { id: 'h-1', userId: 'user-1', downloadId: null, url: 'https://youtube.com/watch?v=test1', title: 'Test Video 1', thumbnailUrl: null, mediaType: 'video', quality: '720p', format: '137', fileSize: 1000000, duration: 120, completedAt: new Date().toISOString(), createdAt: new Date().toISOString() };
const historyRecord2: HistoryRecord = { id: 'h-2', userId: 'user-1', downloadId: null, url: 'https://youtube.com/watch?v=test2', title: 'Test Video 2', thumbnailUrl: null, mediaType: 'video', quality: '720p', format: '137', fileSize: 2000000, duration: 240, completedAt: new Date().toISOString(), createdAt: new Date(Date.now() - 1000).toISOString() };

test('history list requires auth', async () => {
  const auth = { currentUser: async (token?: string) => (token === 'valid' ? ({ id: 'user-1', email: 'x@y.test', displayName: null, language: 'en' } as PublicUser) : null) } as unknown as AuthService;
  const repository = new FakeHistoryRepository();
  const historyService = new HistoryService(repository as unknown as HistoryRepository, new FakeDownloadService() as unknown as DownloadService);
  const app = await buildApp({ authService: auth, historyService, databaseHealthCheck: async () => true });
  try {
    assert.equal((await app.inject({ method: 'GET', url: '/api/history' })).statusCode, 401);
    const response = await app.inject({ method: 'GET', url: '/api/history', headers: { cookie: 'remon_access=valid' } });
    assert.equal(response.statusCode, 200);
    const json = JSON.parse(response.payload);
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
    assert.ok(json.pagination);
  } finally {
    await app.close();
  }
});

test('history list with pagination and search', async () => {
  const repository = new FakeHistoryRepository();
  repository.records.set('h-1', historyRecord1);
  repository.records.set('h-2', historyRecord2);
  const service = new HistoryService(repository as unknown as HistoryRepository, new FakeDownloadService() as unknown as DownloadService);
  const result = await service.list('user-1', 1, 20);
  assert.equal(result.data.length, 2);
  assert.equal(result.pagination.total, 2);
  assert.equal(result.pagination.page, 1);
  assert.equal(result.pagination.limit, 20);
  assert.equal(result.pagination.totalPages, 1);

  const searchResult = await service.list('user-1', 1, 20, 'Video 1');
  assert.equal(searchResult.data.length, 1);
  assert.equal(searchResult.data[0].id, 'h-1');
});

test('history get requires ownership', async () => {
  const repository = new FakeHistoryRepository();
  repository.records.set('h-1', historyRecord1);
  const service = new HistoryService(repository as unknown as HistoryRepository, new FakeDownloadService() as unknown as DownloadService);

  const record = await service.get('user-1', 'h-1');
  assert.equal(record.id, 'h-1');

  await assert.rejects(() => service.get('user-2', 'h-1'), (error: Error) => error.message === 'HISTORY_NOT_FOUND');
});

test('history delete requires ownership', async () => {
  const repository = new FakeHistoryRepository();
  repository.records.set('h-1', historyRecord1);
  const service = new HistoryService(repository as unknown as HistoryRepository, new FakeDownloadService() as unknown as DownloadService);

  await service.delete('user-1', 'h-1');
  assert.equal(repository.records.has('h-1'), false);

  repository.records.set('h-2', historyRecord2);
  await assert.rejects(() => service.delete('user-2', 'h-2'), (error: Error) => error.message === 'HISTORY_NOT_FOUND');
});

test('history redownload creates new download', async () => {
  const repository = new FakeHistoryRepository();
  repository.records.set('h-1', historyRecord1);
  const downloadService = new FakeDownloadService();
  const service = new HistoryService(repository as unknown as HistoryRepository, downloadService as unknown as DownloadService);

  const result = await service.redownload('user-1', 'h-1');
  assert.equal(result.downloadId, 'new-download-1');
});
