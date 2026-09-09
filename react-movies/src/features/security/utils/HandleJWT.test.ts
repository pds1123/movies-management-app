import { afterEach, describe, expect, it, vi } from 'vitest';
import { getClaims, getToken, storeToken } from './HandleJWT';

function createToken(payload: Record<string, unknown>) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });

  const encodedPayload = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `header.${encodedPayload}.signature`;
}

describe('HandleJWT', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('reads UTF-8 claims from a valid token', () => {
    storeToken({
      token: createToken({ email: '观众@frame.test', isadmin: true }),
      expiration: new Date(Date.now() + 60_000)
    });

    expect(getClaims()).toEqual(expect.arrayContaining([
      { name: 'email', value: '观众@frame.test' },
      { name: 'isadmin', value: 'true' }
    ]));
  });

  it('removes an expired token', () => {
    storeToken({
      token: createToken({ email: 'expired@frame.test' }),
      expiration: new Date(Date.now() - 60_000)
    });

    expect(getToken()).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('removes a malformed token instead of throwing', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    storeToken({
      token: 'malformed-token',
      expiration: new Date(Date.now() + 60_000)
    });

    expect(getClaims()).toEqual([]);
    expect(localStorage.getItem('token')).toBeNull();
  });
});
