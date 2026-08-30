import { FastifyInstance } from 'fastify';
import { createAuthController } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';
import { loginSchema, registerSchema } from '../schemas/auth';
import { AuthService } from '../services/authService';

export async function authRoutes(fastify: FastifyInstance, options: { authService: AuthService }): Promise<void> {
  const controller = createAuthController(options.authService);
  fastify.post('/auth/register', { schema: registerSchema, config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, controller.register);
  fastify.post('/auth/login', { schema: loginSchema, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, controller.login);
  fastify.post('/auth/logout', controller.logout);
  fastify.post('/auth/refresh', controller.refresh);
  fastify.get('/auth/me', { preHandler: requireAuth }, controller.me);
}