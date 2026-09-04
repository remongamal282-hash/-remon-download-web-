import dotenv from 'dotenv';
import path from 'path';
import { resolveRuntimePath } from './runtimePaths';
import { parseTrustProxy } from './trustProxy';

// Load environment variables from .env file
dotenv.config();

export interface Config {
  port: number;
  host: string;
  databaseUrl: string;
  corsOrigin: string;
  isProduction: boolean;
  authSecret: string;
  ytDlpPath: string;
  metadataTimeoutMs: number;
  metadataMaxConcurrent: number;
  ffmpegPath: string;
  downloadDirectory: string;
  downloadMaxConcurrent: number;
  downloadTimeoutMs: number;
  trustProxy: boolean | string | string[];
}

const isProduction = process.env.NODE_ENV === 'production';
const providedAuthSecret = process.env.AUTH_SECRET;

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL || '',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  isProduction,
  authSecret: providedAuthSecret || (isProduction ? '' : 'development-only-change-me'),
  ytDlpPath: resolveRuntimePath({ envPath: process.env.YTDLP_PATH, resourcesPath: Reflect.get(process, 'resourcesPath'), projectRuntimeDirectory: path.resolve(__dirname, '../../runtime'), fileName: process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp', pathFallback: 'yt-dlp' }),
  ffmpegPath: resolveRuntimePath({ envPath: process.env.FFMPEG_PATH, resourcesPath: Reflect.get(process, 'resourcesPath'), projectRuntimeDirectory: path.resolve(__dirname, '../../runtime'), fileName: process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg', pathFallback: 'ffmpeg' }),
  downloadDirectory: process.env.DOWNLOAD_DIRECTORY || path.join(process.env.LOCALAPPDATA || process.env.HOME || process.cwd(), 'Remon Download', 'downloads'),
  downloadMaxConcurrent: parseInt(process.env.DOWNLOAD_MAX_CONCURRENT || '3', 10),
  downloadTimeoutMs: parseInt(process.env.DOWNLOAD_TIMEOUT_MS || '3600000', 10),
  metadataTimeoutMs: parseInt(process.env.METADATA_TIMEOUT_MS || '30000', 10),
  metadataMaxConcurrent: parseInt(process.env.METADATA_MAX_CONCURRENT || '2', 10),
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
};

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required. Set it in backend/.env before starting the backend.');
}

if (config.isProduction && (!providedAuthSecret || providedAuthSecret === 'development-only-change-me')) {
  throw new Error('AUTH_SECRET must be set to a strong secret in production.');
}
