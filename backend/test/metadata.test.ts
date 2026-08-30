import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import { buildApp } from '../src/app';
import { MetadataProvider } from '../src/services/metadataProvider';
import { MetadataService } from '../src/services/metadataService';
import { NormalizedMetadata } from '../src/types/metadata';
import { YouTubeMetadataProvider } from '../src/services/youtubeMetadataProvider';
import { AuthService, PublicUser } from '../src/services/authService';

const user: PublicUser = { id: 'user-1', email: 'metadata@example.com', displayName: null, language: 'en' };
const video: NormalizedMetadata = { type: 'video', platform: 'youtube', id: 'abc', url: 'https://www.youtube.com/watch?v=abc', title: 'Example', description: null, thumbnail: null, duration: 10, channel: { id: null, name: 'Channel', url: null }, viewCount: 0, uploadDate: null, formats: [] };

class FakeProvider implements MetadataProvider {
  resolve: (url: URL) => Promise<NormalizedMetadata> = async () => video;
  analyze(url: URL) { return this.resolve(url); }
}

function auth(): AuthService {
  return { currentUser: async (token?: string) => token === 'valid' ? user : null } as unknown as AuthService;
}

function appWith(provider: MetadataProvider) {
  return buildApp({ databaseHealthCheck: async () => true, authService: auth(), metadataService: new MetadataService(provider, 1) });
}

test('metadata accepts video, shorts, and playlist URLs and normalizes output', async () => {
  const provider = new FakeProvider(); const app = await appWith(provider);
  try {
    for (const url of ['https://www.youtube.com/watch?v=abc', 'https://youtube.com/shorts/abc', 'https://www.youtube.com/playlist?list=xyz']) {
      const response = await app.inject({ method: 'POST', url: '/api/metadata/analyze', headers: { cookie: 'remon_access=valid' }, payload: { url } });
      assert.equal(response.statusCode, 200); assert.deepEqual(response.json().data, video);
    }
  } finally { await app.close(); }
});

test('metadata rejects invalid, malformed, unsupported, and missing URLs', async () => {
  const app = await appWith(new FakeProvider());
  try {
    for (const [payload, expectedCode] of [[{}, 'VALIDATION_ERROR'], [{ url: 'not-a-url' }, 'INVALID_URL'], [{ url: 'https://example.com/video' }, 'UNSUPPORTED_PLATFORM'], [{ url: 'https://youtube.com/channel/abc' }, 'INVALID_URL']] as const) {
      const response = await app.inject({ method: 'POST', url: '/api/metadata/analyze', headers: { cookie: 'remon_access=valid' }, payload });
      assert.equal(response.json().error.code, expectedCode);
    }
  } finally { await app.close(); }
});

test('metadata requires authentication and protects provider errors', async () => {
  const provider = new FakeProvider(); provider.resolve = async () => { throw new Error('/private/path stderr secret'); };
  const app = await appWith(provider);
  try {
    assert.equal((await app.inject({ method: 'POST', url: '/api/metadata/analyze', payload: { url: 'https://youtu.be/abc' } })).statusCode, 401);
    const response = await app.inject({ method: 'POST', url: '/api/metadata/analyze', headers: { cookie: 'remon_access=valid' }, payload: { url: 'https://youtu.be/abc' } });
    assert.equal(response.statusCode, 502); assert.equal(JSON.stringify(response.json()).includes('private'), false);
  } finally { await app.close(); }
});

test('metadata rejects concurrent work', async () => {
  const provider = new FakeProvider(); let release!: () => void;
  provider.resolve = () => new Promise((resolve) => { release = () => resolve(video); });
  const service = new MetadataService(provider, 1);
  const first = service.analyze('https://youtu.be/abc');
  await assert.rejects(() => service.analyze('https://youtu.be/def'), (error: Error) => error.message === 'METADATA_BUSY');
  release(); await first;
});

function fakeChild() {
  const child = new EventEmitter() as EventEmitter & { stdout: EventEmitter; stderr: EventEmitter; kill: () => void };
  child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); child.kill = () => undefined; return child;
}

test('yt-dlp unavailable, timeout, failure, and malformed JSON are controlled', async () => {
  await assert.rejects(() => new YouTubeMetadataProvider('missing-yt-dlp').analyze(new URL('https://youtu.be/abc')), (error: Error) => error.message === 'METADATA_UNAVAILABLE');
  const timeoutChild = fakeChild(); await assert.rejects(() => new YouTubeMetadataProvider('mock', 1, (() => timeoutChild) as never).analyze(new URL('https://youtu.be/abc')), (error: Error) => error.message === 'METADATA_TIMEOUT');
  const failedChild = fakeChild(); const failure = new YouTubeMetadataProvider('mock', 100, (() => failedChild) as never).analyze(new URL('https://youtu.be/abc')); failedChild.emit('close', 1); await assert.rejects(failure, (error: Error) => error.message === 'METADATA_FAILED');
  const malformedChild = fakeChild(); const malformed = new YouTubeMetadataProvider('mock', 100, (() => malformedChild) as never).analyze(new URL('https://youtu.be/abc')); malformedChild.stdout.emit('data', Buffer.from('{bad')); malformedChild.emit('close', 0); await assert.rejects(malformed, (error: Error) => error.message === 'METADATA_FAILED');
});