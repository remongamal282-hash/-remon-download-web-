import { FastifyReply, FastifyRequest } from 'fastify';
import { SchedulerService, ScheduleServiceError } from '../services/schedulerService';

const errorMap: Record<ScheduleServiceError['code'], { status: number; message: string }> = {
  INVALID_URL: { status: 400, message: 'Invalid YouTube URL' },
  INVALID_SCHEDULE_TIME: { status: 400, message: 'Schedule time must be in the future' },
  INVALID_QUALITY: { status: 400, message: 'Invalid quality' },
  INVALID_FORMAT: { status: 400, message: 'Invalid format' },
  SCHEDULE_NOT_FOUND: { status: 404, message: 'Schedule not found' },
  INVALID_STATE: { status: 400, message: 'Invalid schedule state' },
};

export function createSchedulerController(service: SchedulerService) {
  return {
    list: async (request: FastifyRequest, reply: FastifyReply) => {
      const records = await service.list(request.user?.id as string);
      return reply.send({ success: true, data: records });
    },
    get: async (request: FastifyRequest, reply: FastifyReply) => {
      const id = String((request.params as { id?: string })?.id ?? '');
      try {
        const record = await service.get(request.user?.id as string, id);
        return reply.send({ success: true, data: record });
      } catch (error: unknown) {
        if (error instanceof ScheduleServiceError) {
          const mapped = errorMap[error.code];
          return reply.code(mapped.status).send({ success: false, error: { code: error.code, message: mapped.message } });
        }
        throw error;
      }
    },
    create: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const record = await service.create(request.user?.id as string, request.body as any);
        return reply.code(201).send({ success: true, data: record });
      } catch (error: unknown) {
        if (error instanceof ScheduleServiceError) {
          const mapped = errorMap[error.code];
          return reply.code(mapped.status).send({ success: false, error: { code: error.code, message: mapped.message } });
        }
        throw error;
      }
    },
    update: async (request: FastifyRequest, reply: FastifyReply) => {
      const id = String((request.params as { id?: string })?.id ?? '');
      try {
        const record = await service.update(request.user?.id as string, id, request.body as any);
        return reply.send({ success: true, data: record });
      } catch (error: unknown) {
        if (error instanceof ScheduleServiceError) {
          const mapped = errorMap[error.code];
          return reply.code(mapped.status).send({ success: false, error: { code: error.code, message: mapped.message } });
        }
        throw error;
      }
    },
    delete: async (request: FastifyRequest, reply: FastifyReply) => {
      const id = String((request.params as { id?: string })?.id ?? '');
      try {
        await service.delete(request.user?.id as string, id);
        return reply.send({ success: true, data: { id } });
      } catch (error: unknown) {
        if (error instanceof ScheduleServiceError) {
          const mapped = errorMap[error.code];
          return reply.code(mapped.status).send({ success: false, error: { code: error.code, message: mapped.message } });
        }
        throw error;
      }
    },
    enable: async (request: FastifyRequest, reply: FastifyReply) => {
      const id = String((request.params as { id?: string })?.id ?? '');
      try {
        const record = await service.setEnabled(request.user?.id as string, id, true);
        return reply.send({ success: true, data: record });
      } catch (error: unknown) {
        if (error instanceof ScheduleServiceError) {
          const mapped = errorMap[error.code];
          return reply.code(mapped.status).send({ success: false, error: { code: error.code, message: mapped.message } });
        }
        throw error;
      }
    },
    disable: async (request: FastifyRequest, reply: FastifyReply) => {
      const id = String((request.params as { id?: string })?.id ?? '');
      try {
        const record = await service.setEnabled(request.user?.id as string, id, false);
        return reply.send({ success: true, data: record });
      } catch (error: unknown) {
        if (error instanceof ScheduleServiceError) {
          const mapped = errorMap[error.code];
          return reply.code(mapped.status).send({ success: false, error: { code: error.code, message: mapped.message } });
        }
        throw error;
      }
    },
  };
}
