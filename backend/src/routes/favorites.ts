import { FastifyInstance } from 'fastify';
import { createFavoritesController } from '../controllers/favoritesController';
import { requireAuth } from '../middleware/auth';
import { FavoritesService } from '../services/favoritesService';

export async function favoritesRoutes(fastify: FastifyInstance, options: { favoritesService: FavoritesService }): Promise<void> {
  const controller = createFavoritesController(options.favoritesService);
  const protectedRoute = { preHandler: requireAuth };

  fastify.get('/favorites', protectedRoute, controller.list);
  fastify.get('/favorites/:id', protectedRoute, controller.get);
  fastify.post('/favorites', protectedRoute, controller.add);
  fastify.delete('/favorites/:id', protectedRoute, controller.delete);
  fastify.post('/favorites/:id/download', protectedRoute, controller.download);
}
