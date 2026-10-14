import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadHealth, parseHealth } from './health';
afterEach(() => vi.unstubAllGlobals());
describe('Health contract', () => {
  it('accepts the documented local response', () => {
    expect(parseHealth({ status: 'up', database: 'up', mode: 'local' }).status).toBe('up');
  });
  it.each([null, {}, {status:'up', database:'up', mode:'public'}, {status:'ok', database:'up', mode:'local'}, {status:['up'], database:'up', mode:'local'}])('rejects malformed response %j', value => {
    expect(() => parseHealth(value)).toThrow();
  });
  it('does not report success when the proxy fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 503 })));
    await expect(loadHealth()).rejects.toThrow('Serviço indisponível');
  });
  it('does not report success when database is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({status:'up', database:'down', mode:'local'})));
    await expect(loadHealth()).rejects.toThrow('Serviço indisponível');
  });
});
