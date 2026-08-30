import { FastifyReply, FastifyRequest } from 'fastify';
import '@fastify/cookie';
import { AuthError, AuthResult, AuthService } from '../services/authService';
import { config } from '../config';

const cookieBase = { httpOnly: true, sameSite: 'lax' as const, secure: config.isProduction, path: '/' };

function setAuthCookies(reply: FastifyReply, result: AuthResult): void {
  reply.setCookie('remon_access', result.accessToken, { ...cookieBase, maxAge: 15 * 60 });
  reply.setCookie('remon_refresh', result.refreshToken, { ...cookieBase, maxAge: 30 * 24 * 60 * 60 });
}

function errorResponse(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof AuthError) {
    const duplicate = error.code === 'EMAIL_EXISTS';
    return reply.code(duplicate ? 409 : 401).send({
      success: false,
      error: { code: duplicate ? 'EMAIL_EXISTS' : 'INVALID_CREDENTIALS', message: duplicate ? 'Email is already registered' : 'Invalid credentials' },
    });
  }
  throw error;
}

function normalizeEmail(email: string): string { return email.trim().toLowerCase(); }

export function createAuthController(authService: AuthService) {
  return {
    register: async (request: FastifyRequest<{ Body: { email: string; password: string; passwordConfirmation?: string; displayName?: string } }>, reply: FastifyReply) => {
      if (request.body.passwordConfirmation !== undefined && request.body.password !== request.body.passwordConfirmation) {
        return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request' } });
      }
      try {
        const result = await authService.register(normalizeEmail(request.body.email), request.body.password, request.body.displayName?.trim() || null);
        setAuthCookies(reply, result);
        return reply.code(201).send({ success: true, data: { user: result.user } });
      } catch (error: unknown) { return errorResponse(reply, error); }
    },
    login: async (request: FastifyRequest<{ Body: { email: string; password: string } }>, reply: FastifyReply) => {
      try {
        const result = await authService.login(normalizeEmail(request.body.email), request.body.password);
        setAuthCookies(reply, result);
        return reply.send({ success: true, data: { user: result.user } });
      } catch (error: unknown) { return errorResponse(reply, error); }
    },
    logout: async (request: FastifyRequest, reply: FastifyReply) => {
      await authService.logout(request.cookies.remon_access, request.cookies.remon_refresh);
      reply.clearCookie('remon_access', cookieBase);
      reply.clearCookie('remon_refresh', cookieBase);
      return reply.send({ success: true, data: null });
    },
    refresh: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const result = await authService.refresh(request.cookies.remon_refresh);
        setAuthCookies(reply, result);
        return reply.send({ success: true, data: { user: result.user } });
      } catch (error: unknown) { return errorResponse(reply, error); }
    },
    me: async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await authService.currentUser(request.cookies.remon_access);
      if (!user) return reply.code(401).send({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } });
      return reply.send({ success: true, data: { user } });
    },
  };
}