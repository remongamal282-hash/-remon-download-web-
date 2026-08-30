import { FastifyInstance } from 'fastify';

export function registerNotFoundHandler(fastify: FastifyInstance): void {
  fastify.setNotFoundHandler((_request, reply) => {
    return reply.code(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });
}