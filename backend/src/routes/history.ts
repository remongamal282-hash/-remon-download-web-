import { FastifyInstance } from 'fastify';
import { createHistoryController } from '../controllers/historyController';
import { requireAuth } from '../middleware/auth';
import { HistoryService } from '../services/historyService';

export async function historyRoutes(fastify: FastifyInstance, options: { historyService: HistoryService }): Promise<void> {
  const controller = createHistoryController(options.historyService);
  const protectedRoute = { preHandler: requireAuth };

  fastify.get('/history', protectedRoute, controller.list);
  fastify.get('/history/:id', protectedRoute, controller.get);
  fastify.delete('/history/:id', protectedRoute, controller.delete);
  fastify.post('/history/:id/redownload', protectedRoute, controller.redownload);
}
