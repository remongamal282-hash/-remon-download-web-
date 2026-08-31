import { FastifyInstance } from 'fastify';
import { createDownloadController } from '../controllers/downloadController';
import { requireAuth } from '../middleware/auth';
import { createDownloadSchema } from '../schemas/download';
import { DownloadService } from '../services/downloadService';

export async function downloadRoutes(fastify: FastifyInstance, options: { downloadService: DownloadService }): Promise<void> {
  const controller = createDownloadController(options.downloadService);
  const protectedRoute = { preHandler: requireAuth };
  fastify.post('/downloads', {
    ...protectedRoute,
    schema: createDownloadSchema,
    config: { rateLimit: { max: 12, timeWindow: '1 minute' } },
  }, controller.create);
  fastify.get('/downloads', protectedRoute, controller.list);
  fastify.get('/downloads/:id', protectedRoute, controller.get);
  fastify.post('/downloads/:id/pause', protectedRoute, controller.pause);
  fastify.post('/downloads/:id/resume', protectedRoute, controller.resume);
  fastify.post('/downloads/:id/stop', protectedRoute, controller.stop);
  fastify.post('/downloads/:id/cancel', protectedRoute, controller.cancel);
  fastify.post('/downloads/:id/retry', protectedRoute, controller.retry);
}