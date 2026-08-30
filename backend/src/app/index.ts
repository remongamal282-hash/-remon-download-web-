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
import { HistoryService } from '../services/historyService';
import { FavoritesService } from '../services/favoritesService';

export interface AppOptions {
  databaseHealthCheck?: () => Promise<boolean>;
  authService?: AuthService;
  metadataService?: MetadataService;
  downloadService?: DownloadService;
  historyService?: HistoryService;
  favoritesService?: FavoritesService;
}

export async function buildApp(options: AppOptions = {}): Promise<FastifyInstance> {
  const fastify = Fastify({
    bodyLimit: 1_048_576,
    logger: {
      level: config.isProduction ? 'info' : 'debug',
    },
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
  fastify.decorate('authService', authService);
  fastify.decorate('metadataService', metadataService);
  fastify.decorate('downloadService', downloadService);

  registerErrorHandler(fastify);
  registerNotFoundHandler(fastify);
  await registerRoutes(fastify, {
    healthService: new HealthService(options.databaseHealthCheck || checkDatabaseHealth),
    authService,
    metadataService,
    downloadService,
    historyService,
    favoritesService,
  });

  fastify.addHook('onClose', async () => {
    await closePool();
  });

  return fastify;
}
