import { FastifyError, FastifyInstance } from 'fastify';

export function registerErrorHandler(fastify: FastifyInstance): void {
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    if (error.validation) {
      request.log.warn({ errorCode: 'VALIDATION_ERROR' }, 'Request validation failed');
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request' },
      });
    }

    request.log.error({ errorCode: 'INTERNAL_SERVER_ERROR' }, error.message);
    return reply.code(error.statusCode && error.statusCode >= 400 ? error.statusCode : 500).send({
      success: false,
      error: {
        code: error.statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR',
        message: error.statusCode && error.statusCode < 500 ? error.message : 'Internal server error',
      },
    });
  });
}