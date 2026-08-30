import assert from 'node:assert/strict';
import test from 'node:test';
import { FavoriteRepository } from '../src/repositories/FavoriteRepository';
import { FavoritesService, FavoritesServiceError } from '../src/services/favoritesService';
import { FavoriteRecord } from '../src/types/favorites';
import { buildApp } from '../src/app';
import { AuthService, PublicUser } from '../src/services/authService';
import { DownloadService } from '../src/services/downloadService';
import { DownloadRecord } from '../src/types/download';

class FakeFavoriteRepository implements Partial<FavoriteRepository> {
  records = new Map<string, FavoriteRecord>();

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

  async findByUrlForUser(url: string, userId: string) {
    return [...this.records.values()].find((r) => r.url === url && r.userId === userId) || null;
  }

  async create(userId: string, data: any) {
    const record = { id: `fav-${Date.now()}`, userId, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.records.set(record.id, record);
    return record;
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

const favoriteRecord1: FavoriteRecord = { id: 'f-1', userId: 'user-1', url: 'https://youtube.com/watch?v=test1', title: 'Favorite 1', thumbnailUrl: null, mediaType: 'video', duration: 120, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
const favoriteRecord2: FavoriteRecord = { id: 'f-2', userId: 'user-1', url: 'https://youtube.com/watch?v=test2', title: 'Favorite 2', thumbnailUrl: null, mediaType: 'video', duration: 240, createdAt: new Date(Date.now() - 1000).toISOString(), updatedAt: new Date(Date.now() - 1000).toISOString() };

test('favorites list requires auth', async () => {
  const auth = { currentUser: async (token?: string) => (token === 'valid' ? ({ id: 'user-1', email: 'x@y.test', displayName: null, language: 'en' } as PublicUser) : null) } as unknown as AuthService;
  const repository = new FakeFavoriteRepository();
  const favoritesService = new FavoritesService(repository as unknown as FavoriteRepository, new FakeDownloadService() as unknown as DownloadService);
  const app = await buildApp({ authService: auth, favoritesService, databaseHealthCheck: async () => true });
  try {
    assert.equal((await app.inject({ method: 'GET', url: '/api/favorites' })).statusCode, 401);
    const response = await app.inject({ method: 'GET', url: '/api/favorites', headers: { cookie: 'remon_access=valid' } });
    assert.equal(response.statusCode, 200);
    const json = JSON.parse(response.payload);
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
    assert.ok(json.pagination);
  } finally {
    await app.close();
  }
});

test('favorites list with pagination and search', async () => {
  const repository = new FakeFavoriteRepository();
  repository.records.set('f-1', favoriteRecord1);
  repository.records.set('f-2', favoriteRecord2);
  const service = new FavoritesService(repository as unknown as FavoriteRepository, new FakeDownloadService() as unknown as DownloadService);
  const result = await service.list('user-1', 1, 20);
  assert.equal(result.data.length, 2);
  assert.equal(result.pagination.total, 2);

  const searchResult = await service.list('user-1', 1, 20, 'Favorite 1');
  assert.equal(searchResult.data.length, 1);
  assert.equal(searchResult.data[0].id, 'f-1');
});

test('favorites add with duplicate protection', async () => {
  const repository = new FakeFavoriteRepository();
  const service = new FavoritesService(repository as unknown as FavoriteRepository, new FakeDownloadService() as unknown as DownloadService);

  const fav1 = await service.add('user-1', { url: 'https://youtube.com/watch?v=test1', title: 'Test 1' });
  assert.equal(fav1.url, 'https://youtube.com/watch?v=test1');

  await assert.rejects(() => service.add('user-1', { url: 'https://youtube.com/watch?v=test1', title: 'Test 1' }), (error: Error) => error.message === 'FAVORITE_DUPLICATE');
});

test('favorites add validates YouTube URLs', async () => {
  const repository = new FakeFavoriteRepository();
  const service = new FavoritesService(repository as unknown as FavoriteRepository, new FakeDownloadService() as unknown as DownloadService);

  await assert.rejects(() => service.add('user-1', { url: 'https://example.com/video', title: 'Test' }), (error: Error) => error.message === 'INVALID_URL');
  await assert.rejects(() => service.add('user-1', { url: 'not-a-url', title: 'Test' }), (error: Error) => error.message === 'INVALID_URL');
});

test('favorites get requires ownership', async () => {
  const repository = new FakeFavoriteRepository();
  repository.records.set('f-1', favoriteRecord1);
  const service = new FavoritesService(repository as unknown as FavoriteRepository, new FakeDownloadService() as unknown as DownloadService);

  const record = await service.get('user-1', 'f-1');
  assert.equal(record.id, 'f-1');

  await assert.rejects(() => service.get('user-2', 'f-1'), (error: Error) => error.message === 'FAVORITE_NOT_FOUND');
});

test('favorites delete requires ownership', async () => {
  const repository = new FakeFavoriteRepository();
  repository.records.set('f-1', favoriteRecord1);
  const service = new FavoritesService(repository as unknown as FavoriteRepository, new FakeDownloadService() as unknown as DownloadService);

  await service.delete('user-1', 'f-1');
  assert.equal(repository.records.has('f-1'), false);

  repository.records.set('f-2', favoriteRecord2);
  await assert.rejects(() => service.delete('user-2', 'f-2'), (error: Error) => error.message === 'FAVORITE_NOT_FOUND');
});

test('favorites download creates new download', async () => {
  const repository = new FakeFavoriteRepository();
  repository.records.set('f-1', favoriteRecord1);
  const downloadService = new FakeDownloadService();
  const service = new FavoritesService(repository as unknown as FavoriteRepository, downloadService as unknown as DownloadService);

  const result = await service.download('user-1', 'f-1');
  assert.equal(result.downloadId, 'new-download-1');
});

test('cross-user security: user cannot access other users history', async () => {
  const repository = new FakeFavoriteRepository();
  repository.records.set('f-1', favoriteRecord1);
  const service = new FavoritesService(repository as unknown as FavoriteRepository, new FakeDownloadService() as unknown as DownloadService);

  await assert.rejects(() => service.get('user-2', 'f-1'), (error: Error) => error.message === 'FAVORITE_NOT_FOUND');
  await assert.rejects(() => service.delete('user-2', 'f-1'), (error: Error) => error.message === 'FAVORITE_NOT_FOUND');
});
