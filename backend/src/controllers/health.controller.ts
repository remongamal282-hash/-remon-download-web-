import { FastifyReply, FastifyRequest } from 'fastify';
import { HealthService } from '../services';

export function healthController(service: HealthService) {
  return async (_request: FastifyRequest, reply: FastifyReply) => {
    const database = await service.isDatabaseHealthy();

    if (!database) {
      return reply.code(503).send({ status: 'ok', database: 'error' });
    }

    return { status: 'ok', database: 'ok' };
  };
}