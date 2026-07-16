/**
 * @jest-environment node
 */

jest.mock('server-only', () => ({}));

import { ParsedToken } from '@/lib/account/parsed-token';

describe('ParsedToken', () => {
  test('returns the stable NameIdentifier claim', () => {
    const payload = {
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier':
        'core-user-123',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'Alice',
      role: 'User',
      exp: 4_000_000_000,
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const token = new ParsedToken(`header.${encoded}.signature`);

    expect(token.success()).toBe(true);
    expect(token.userId()).toBe('core-user-123');
    expect(token.name()).toBe('Alice');
  });
});
