import { FastifyReply, FastifyRequest } from 'fastify';
import { DownloadService, DownloadServiceError } from '../services/downloadService';

const errorMap: Record<DownloadServiceError['code'], { status: number; message: string }> = {
  INVALID_URL: { status: 400, message: 'Invalid download URL' }, INVALID_DOWNLOAD_OPTIONS: { status: 400, message: 'Invalid download options' }, DOWNLOAD_NOT_FOUND: { status: 404, message: 'Download not found' }, INVALID_STATE: { status: 409, message: 'Invalid download state transition' }, DOWNLOAD_BUSY: { status: 429, message: 'Download is busy' },
};

export function createDownloadController(service: DownloadService) {
  const handle = async (request: FastifyRequest, reply: FastifyReply, action: (userId: string, id: string) => Promise<unknown>) => {
    try { return reply.send({ success: true, data: await action(request.user?.id as string, (request.params as { id: string }).id) }); }
    catch (error: unknown) { if (error instanceof DownloadServiceError) { const mapped = errorMap[error.code]; return reply.code(mapped.status).send({ success: false, error: { code: error.code, message: mapped.message } }); } throw error; }
  };
  return {
    create: async (request: FastifyRequest, reply: FastifyReply) => {
      try { const record = await service.create(request.user?.id as string, request.body as { url: string; format: string; quality: string; outputFormat: string }); return reply.code(202).send({ success: true, data: record }); }
      catch (error: unknown) { if (error instanceof DownloadServiceError) { const mapped = errorMap[error.code]; return reply.code(mapped.status).send({ success: false, error: { code: error.code, message: mapped.message } }); } throw error; }
    },
    list: async (request: FastifyRequest, reply: FastifyReply) => reply.send({ success: true, data: await service.list(request.user?.id as string) }),
    get: (request: FastifyRequest, reply: FastifyReply) => handle(request, reply, service.get.bind(service)),
    pause: (request: FastifyRequest, reply: FastifyReply) => handle(request, reply, service.pause.bind(service)),
    resume: (request: FastifyRequest, reply: FastifyReply) => handle(request, reply, service.resume.bind(service)),
    stop: (request: FastifyRequest, reply: FastifyReply) => handle(request, reply, service.stop.bind(service)),
    cancel: (request: FastifyRequest, reply: FastifyReply) => handle(request, reply, service.cancel.bind(service)),
    retry: (request: FastifyRequest, reply: FastifyReply) => handle(request, reply, service.retry.bind(service)),
  };
}