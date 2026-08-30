import { FastifyReply, FastifyRequest } from 'fastify';
import { MetadataService, MetadataServiceError } from '../services/metadataService';

const messages: Record<MetadataServiceError['code'], { status: number; message: string }> = {
  INVALID_URL: { status: 400, message: 'Invalid URL' },
  UNSUPPORTED_PLATFORM: { status: 422, message: 'Unsupported platform' },
  METADATA_BUSY: { status: 429, message: 'Metadata analysis is busy' },
  METADATA_UNAVAILABLE: { status: 503, message: 'Metadata provider unavailable' },
  METADATA_TIMEOUT: { status: 504, message: 'Metadata analysis timed out' },
  METADATA_FAILED: { status: 502, message: 'Metadata analysis failed' },
};

export function createMetadataController(service: MetadataService) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as { url: string };
      const metadata = await service.analyze(body.url);
      return reply.send({ success: true, data: metadata });
    } catch (error: unknown) {
      if (error instanceof MetadataServiceError) {
        const response = messages[error.code];
        return reply.code(response.status).send({ success: false, error: { code: error.code, message: response.message } });
      }
      throw error;
    }
  };
}