import { FastifyInstance } from 'fastify';
import { createMetadataController } from '../controllers/metadataController';
import { requireAuth } from '../middleware/auth';
import { MetadataService } from '../services/metadataService';

const schema = {
  body: {
    type: 'object', additionalProperties: false, required: ['url'],
    properties: { url: { type: 'string', minLength: 1, maxLength: 2048 } },
  },
} as const;

export async function metadataRoutes(fastify: FastifyInstance, options: { metadataService: MetadataService }): Promise<void> {
  fastify.post('/metadata/analyze', { schema, preHandler: requireAuth, config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, createMetadataController(options.metadataService));
}