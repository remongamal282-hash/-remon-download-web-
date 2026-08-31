import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health';
import { HealthService } from '../services';
import { AuthService } from '../services/authService';
import { authRoutes } from './auth';
import { metadataRoutes } from './metadata';
import { MetadataService } from '../services/metadataService';
import { DownloadService } from '../services/downloadService';
import { downloadRoutes } from './downloads';
import { HistoryService } from '../services/historyService';
import { historyRoutes } from './history';
import { FavoritesService } from '../services/favoritesService';
import { favoritesRoutes } from './favorites';
import { SettingsService } from '../services/settingsService';
import { settingsRoutes } from './settings';
import { SchedulerService } from '../services/schedulerService';
import { schedulerRoutes } from './scheduler';

export interface RouteDependencies {
  healthService: HealthService;
  authService: AuthService;
  metadataService: MetadataService;
  downloadService: DownloadService;
  historyService: HistoryService;
  favoritesService: FavoritesService;
  settingsService: SettingsService;
  schedulerService: SchedulerService;
}

export async function registerRoutes(
  fastify: FastifyInstance,
  dependencies: RouteDependencies
): Promise<void> {
  await fastify.register(healthRoutes, {
    prefix: '/api',
    healthService: dependencies.healthService,
  });
  await fastify.register(authRoutes, { prefix: '/api', authService: dependencies.authService });
  await fastify.register(metadataRoutes, { prefix: '/api', metadataService: dependencies.metadataService });
  await fastify.register(downloadRoutes, { prefix: '/api', downloadService: dependencies.downloadService });
  await fastify.register(historyRoutes, { prefix: '/api', historyService: dependencies.historyService });
  await fastify.register(favoritesRoutes, { prefix: '/api', favoritesService: dependencies.favoritesService });
  await fastify.register(settingsRoutes, { prefix: '/api', settingsService: dependencies.settingsService });
  await fastify.register(schedulerRoutes, { prefix: '/api', schedulerService: dependencies.schedulerService });
}