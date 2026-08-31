import { FastifyInstance } from 'fastify';
import { createSchedulerController } from '../controllers/schedulerController';
import { requireAuth } from '../middleware/auth';
import { SchedulerService } from '../services/schedulerService';

export async function schedulerRoutes(fastify: FastifyInstance, options: { schedulerService: SchedulerService }): Promise<void> {
  const controller = createSchedulerController(options.schedulerService);
  const protectedRoute = { preHandler: requireAuth };

  fastify.post('/scheduler', protectedRoute, controller.create);
  fastify.get('/scheduler', protectedRoute, controller.list);
  fastify.get('/scheduler/:id', protectedRoute, controller.get);
  fastify.put('/scheduler/:id', protectedRoute, controller.update);
  fastify.delete('/scheduler/:id', protectedRoute, controller.delete);
  fastify.post('/scheduler/:id/enable', protectedRoute, controller.enable);
  fastify.post('/scheduler/:id/disable', protectedRoute, controller.disable);
}
