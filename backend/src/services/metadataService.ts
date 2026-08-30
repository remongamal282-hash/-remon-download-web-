import { config } from '../config';
import { MetadataProvider } from './metadataProvider';

export type MetadataServiceErrorCode = 'INVALID_URL' | 'UNSUPPORTED_PLATFORM' | 'METADATA_BUSY' | 'METADATA_UNAVAILABLE' | 'METADATA_TIMEOUT' | 'METADATA_FAILED';

export class MetadataServiceError extends Error { constructor(public readonly code: MetadataServiceErrorCode) { super(code); } }

function validateUrl(value: string): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw new MetadataServiceError('INVALID_URL'); }
  if (value.length > 2048 || !['http:', 'https:'].includes(url.protocol)) throw new MetadataServiceError('INVALID_URL');
  const host = url.hostname.toLowerCase();
  if (!(host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com'))) throw new MetadataServiceError('UNSUPPORTED_PLATFORM');
  if (host === 'youtu.be' && !url.pathname.slice(1)) throw new MetadataServiceError('INVALID_URL');
  if (host !== 'youtu.be' && !url.pathname.startsWith('/watch') && !url.pathname.startsWith('/shorts/') && !url.pathname.startsWith('/playlist')) throw new MetadataServiceError('INVALID_URL');
  return url;
}

export class MetadataService {
  private active = 0;
  constructor(private readonly provider: MetadataProvider, private readonly maxConcurrent = config.metadataMaxConcurrent) {}

  async analyze(value: string) {
    if (this.active >= this.maxConcurrent) throw new MetadataServiceError('METADATA_BUSY');
    const url = validateUrl(value); this.active += 1;
    try { return await this.provider.analyze(url); }
    catch (error: unknown) { if (error instanceof MetadataServiceError) throw error; const code = error instanceof Error && 'code' in error ? String((error as { code?: string }).code) : 'METADATA_FAILED'; if (['METADATA_UNAVAILABLE', 'METADATA_TIMEOUT', 'METADATA_FAILED'].includes(code)) throw new MetadataServiceError(code as MetadataServiceErrorCode); throw new MetadataServiceError('METADATA_FAILED'); }
    finally { this.active -= 1; }
  }
}