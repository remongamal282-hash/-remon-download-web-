import { FastifyInstance } from 'fastify';
import { createSettingsController } from '../controllers/settingsController';
import { requireAuth } from '../middleware/auth';
import { SettingsService } from '../services/settingsService';

export async function settingsRoutes(fastify: FastifyInstance, options: { settingsService: SettingsService }): Promise<void> {
  const controller = createSettingsController(options.settingsService);
  const protectedRoute = { preHandler: requireAuth };

  fastify.get('/settings', protectedRoute, controller.get);
  fastify.put('/settings', protectedRoute, controller.update);
}
