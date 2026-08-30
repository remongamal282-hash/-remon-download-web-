import { FastifyReply, FastifyRequest } from 'fastify';
import '@fastify/cookie';
import { PublicUser } from '../services/authService';

declare module 'fastify' {
  interface FastifyRequest { user: PublicUser | null; cookies: Record<string, string | undefined>; }
  interface FastifyInstance { authService: import('../services/authService').AuthService; }
  interface FastifyInstance { metadataService: import('../services/metadataService').MetadataService; }
  interface FastifyInstance { downloadService: import('../services/downloadService').DownloadService; }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = await request.server.authService.currentUser(request.cookies.remon_access);
  if (!user) {
    await reply.code(401).send({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } });
    return;
  }
  request.user = user;
}