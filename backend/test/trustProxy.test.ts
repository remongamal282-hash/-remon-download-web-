import assert from 'node:assert/strict';
import test from 'node:test';
import Fastify from 'fastify';
import { parseTrustProxy } from '../src/config/trustProxy';

test('TRUST_PROXY defaults to the existing environment-specific behavior', () => {
  assert.equal(parseTrustProxy(undefined), false);
  assert.equal(parseTrustProxy(''), false);
});

test('TRUST_PROXY parses booleans and explicit proxy addresses', () => {
  assert.equal(parseTrustProxy('true'), true);
  assert.equal(parseTrustProxy('FALSE'), false);
  assert.equal(parseTrustProxy('127.0.0.1'), '127.0.0.1');
  assert.deepEqual(parseTrustProxy('10.0.0.0/8, 192.168.0.0/16'), ['10.0.0.0/8', '192.168.0.0/16']);
});

test('TRUST_PROXY rejects invalid values instead of enabling trust-all', () => {
  assert.throws(() => parseTrustProxy('1'), /TRUST_PROXY must be/);
  assert.throws(() => parseTrustProxy('not-an-address'), /TRUST_PROXY must be/);
  assert.throws(() => parseTrustProxy('10.0.0.0/33'), /TRUST_PROXY must be/);
});

test('parsed TRUST_PROXY values are accepted by Fastify', async () => {
  const trustedApp = Fastify({ trustProxy: parseTrustProxy('true') });
  const untrustedApp = Fastify({ trustProxy: parseTrustProxy('false') });
  trustedApp.get('/', (request) => ({ ip: request.ip }));
  untrustedApp.get('/', (request) => ({ ip: request.ip }));

  try {
    const trustedResponse = await trustedApp.inject({ method: 'GET', url: '/', headers: { 'x-forwarded-for': '203.0.113.10' } });
    const untrustedResponse = await untrustedApp.inject({ method: 'GET', url: '/', headers: { 'x-forwarded-for': '203.0.113.10' } });
    assert.equal(trustedResponse.json().ip, '203.0.113.10');
    assert.equal(untrustedResponse.json().ip, '127.0.0.1');
  } finally {
    await trustedApp.close();
    await untrustedApp.close();
  }
});