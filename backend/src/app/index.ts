import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { config } from '../config';
import { closePool } from '../database';
import { registerRoutes } from '../routes';
import { registerErrorHandler } from '../middleware/errorHandler';
import { registerNotFoundHandler } from '../middleware/notFound';
import { HealthService } from '../services';
import { checkDatabaseHealth } from '../database';
import { AuthService } from '../services/authService';
import { MetadataService } from '../services/metadataService';
import { YouTubeMetadataProvider } from '../services/youtubeMetadataProvider';
import { DownloadService } from '../services/downloadService';
import { DownloadEngine } from '../engine/downloadEngine';
import { HistoryService } from '../services/historyService';
import { FavoritesService } from '../services/favoritesService';
import { SettingsService } from '../services/settingsService';
import { SchedulerService } from '../services/schedulerService';

export interface AppOptions {
  databaseHealthCheck?: () => Promise<boolean>;
  authService?: AuthService;
  metadataService?: MetadataService;
  downloadService?: DownloadService;
  historyService?: HistoryService;
  favoritesService?: FavoritesService;
  settingsService?: SettingsService;
  schedulerService?: SchedulerService;
}

function buildContentSecurityPolicy(): string {
  // Production CSP: only allows HTTPS connections, no hardcoded localhost
  if (config.isProduction) {
    return "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';";
  }
  // Development CSP: allows localhost for development frontend/backend
  return "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' http://localhost:3000 http://127.0.0.1:3000 http://localhost:5173 ws://localhost:5173; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';";
}

export async function buildApp(options: AppOptions = {}): Promise<FastifyInstance> {
  const fastify = Fastify({
    bodyLimit: 1_048_576,
    logger: {
      level: config.isProduction ? 'info' : 'debug',
    },
    trustProxy: config.trustProxy,
  });

  fastify.addHook('onRequest', async (_request, reply) => {
    reply.header('Content-Security-Policy', buildContentSecurityPolicy());
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  });

  // Setup CORS
  await fastify.register(cors, {
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  await fastify.register(cookie as never);
  await fastify.register(rateLimit);
  const authService = options.authService || new AuthService();
  const metadataService = options.metadataService || new MetadataService(new YouTubeMetadataProvider());
  const downloadService = options.downloadService || new DownloadService();
  const historyService = options.historyService || new HistoryService();
  const favoritesService = options.favoritesService || new FavoritesService();
  const settingsService = options.settingsService || new SettingsService();
  const schedulerService = options.schedulerService || new SchedulerService();
  fastify.decorate('authService', authService);
  fastify.decorate('metadataService', metadataService);
  fastify.decorate('downloadService', downloadService);
  fastify.decorate('settingsService', settingsService);
  fastify.decorate('schedulerService', schedulerService);

  // Cleanup orphan files on startup (crashed downloads may leave .part files)
  const downloadEngine = new DownloadEngine();
  await downloadEngine.cleanupOrphanFiles();

  registerErrorHandler(fastify);
  registerNotFoundHandler(fastify);
  await registerRoutes(fastify, {
    healthService: new HealthService(options.databaseHealthCheck || checkDatabaseHealth),
    authService,
    metadataService,
    downloadService,
    historyService,
    favoritesService,
    settingsService,
    schedulerService,
  });

  // Graceful shutdown: stop accepting downloads, close connections
  fastify.addHook('onClose', async () => {
    // Stop accepting new work before closing
    fastify.log.info('Initiating graceful shutdown...');
    await closePool();
    fastify.log.info('Database pool closed');
  });

  return fastify;
}
