import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { healthController } from '../controllers';
import { HealthService } from '../services';

interface HealthRouteOptions extends FastifyPluginOptions {
  healthService: HealthService;
}

export async function healthRoutes(
  fastify: FastifyInstance,
  options: HealthRouteOptions
): Promise<void> {
  fastify.get('/health', {
    schema: {
      response: {
        200: {
          type: 'object',
          required: ['status', 'database'],
          properties: {
            status: { type: 'string', const: 'ok' },
            database: { type: 'string', const: 'ok' },
          },
        },
        503: {
          type: 'object',
          required: ['status', 'database'],
          properties: {
            status: { type: 'string', const: 'ok' },
            database: { type: 'string', const: 'error' },
          },
        },
      },
    },
  }, healthController(options.healthService));
}
