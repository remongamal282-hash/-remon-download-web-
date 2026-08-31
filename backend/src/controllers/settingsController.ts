import { FastifyReply, FastifyRequest } from 'fastify';
import { SettingsService, SettingsServiceError } from '../services/settingsService';

const errorMap: Record<SettingsServiceError['code'], { status: number; message: string }> = {
  INVALID_QUALITY: { status: 400, message: 'Invalid quality' },
  INVALID_FORMAT: { status: 400, message: 'Invalid format' },
  INVALID_LANGUAGE: { status: 400, message: 'Invalid language' },
  INVALID_THEME: { status: 400, message: 'Invalid theme' },
  INVALID_CONCURRENCY: { status: 400, message: 'Invalid concurrency value' },
};

export function createSettingsController(service: SettingsService) {
  return {
    get: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const settings = await service.getOrCreate(request.user?.id as string);
        return reply.send({ success: true, data: settings });
      } catch (error: unknown) {
        if (error instanceof SettingsServiceError) {
          const mapped = errorMap[error.code];
          return reply.code(mapped.status).send({ success: false, error: { code: error.code, message: mapped.message } });
        }
        throw error;
      }
    },
    update: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const settings = await service.update(request.user?.id as string, request.body as any);
        return reply.send({ success: true, data: settings });
      } catch (error: unknown) {
        if (error instanceof SettingsServiceError) {
          const mapped = errorMap[error.code];
          return reply.code(mapped.status).send({ success: false, error: { code: error.code, message: mapped.message } });
        }
        throw error;
      }
    },
  };
}
