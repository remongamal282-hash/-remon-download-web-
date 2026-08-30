import { FastifyReply, FastifyRequest } from 'fastify';
import { HistoryService, HistoryServiceError } from '../services/historyService';

const errorMap: Record<string, { status: number; message: string }> = {
  HISTORY_NOT_FOUND: { status: 404, message: 'History record not found' },
  INVALID_URL: { status: 400, message: 'Invalid URL' },
  DOWNLOAD_FAILED: { status: 500, message: 'Failed to create download' },
};

export function createHistoryController(service: HistoryService) {
  return {
    list: async (request: FastifyRequest, reply: FastifyReply) => {
      const { page = 1, limit = 20, search } = request.query as { page?: number; limit?: number; search?: string };
      const result = await service.list(request.user?.id as string, page, limit, search);
      return reply.send({ success: true, data: result.data, pagination: result.pagination });
    },

    get: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const record = await service.get(request.user?.id as string, id);
        return reply.send({ success: true, data: record });
      } catch (error: unknown) {
        if (error instanceof HistoryServiceError) {
          const mapped = errorMap[error.code];
          return reply.code(mapped.status).send({ success: false, error: { code: error.code, message: mapped.message } });
        }
        throw error;
      }
    },

    delete: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        await service.delete(request.user?.id as string, id);
        return reply.send({ success: true, data: { id } });
      } catch (error: unknown) {
        if (error instanceof HistoryServiceError) {
          const mapped = errorMap[error.code];
          return reply.code(mapped.status).send({ success: false, error: { code: error.code, message: mapped.message } });
        }
        throw error;
      }
    },

    redownload: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const result = await service.redownload(request.user?.id as string, id);
        return reply.code(201).send({ success: true, data: result });
      } catch (error: unknown) {
        if (error instanceof HistoryServiceError) {
          const mapped = errorMap[error.code] || { status: 500, message: error.code };
          return reply.code(mapped.status).send({ success: false, error: { code: error.code, message: mapped.message } });
        }
        throw error;
      }
    },
  };
}
