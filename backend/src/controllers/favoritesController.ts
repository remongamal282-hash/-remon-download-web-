import { FastifyReply, FastifyRequest } from 'fastify';
import { FavoritesService, FavoritesServiceError } from '../services/favoritesService';

const errorMap: Record<string, { status: number; message: string }> = {
  FAVORITE_NOT_FOUND: { status: 404, message: 'Favorite not found' },
  FAVORITE_DUPLICATE: { status: 409, message: 'URL is already favorited' },
  INVALID_URL: { status: 400, message: 'Invalid URL' },
  DOWNLOAD_FAILED: { status: 500, message: 'Failed to create download' },
};

export function createFavoritesController(service: FavoritesService) {
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
        if (error instanceof FavoritesServiceError) {
          const mapped = errorMap[error.code];
          return reply.code(mapped.status).send({ success: false, error: { code: error.code, message: mapped.message } });
        }
        throw error;
      }
    },

    add: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = request.body as { url: string; title?: string | null; thumbnailUrl?: string | null; mediaType?: string | null; duration?: number | null };
        const record = await service.add(request.user?.id as string, body);
        return reply.code(201).send({ success: true, data: record });
      } catch (error: unknown) {
        if (error instanceof FavoritesServiceError) {
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
        if (error instanceof FavoritesServiceError) {
          const mapped = errorMap[error.code];
          return reply.code(mapped.status).send({ success: false, error: { code: error.code, message: mapped.message } });
        }
        throw error;
      }
    },

    download: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as { quality?: string; format?: string } | undefined;
        const result = await service.download(request.user?.id as string, id, body);
        return reply.code(201).send({ success: true, data: result });
      } catch (error: unknown) {
        if (error instanceof FavoritesServiceError) {
          const mapped = errorMap[error.code] || { status: 500, message: error.code };
          return reply.code(mapped.status).send({ success: false, error: { code: error.code, message: mapped.message } });
        }
        throw error;
      }
    },
  };
}
