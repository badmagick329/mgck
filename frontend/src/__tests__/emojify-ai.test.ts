/** @jest-environment node */
jest.mock('server-only', () => ({}));
jest.mock('../lib/account/verified-session', () => ({
  getVerifiedCoreSession: jest.fn(),
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

import { getVerifiedCoreSession } from '@/lib/account/verified-session';
import { emojifyWithAi } from '@/actions/emojify';
import { changeAiAvailability } from '@/actions/ai-monitoring';
import { getAiMonitoring } from '@/lib/emojify/monitoring';

beforeEach(() => {
  jest.clearAllMocks();
  process.env.BASE_URL = 'http://django.test';
  process.env.NEXT_DJANGO_INTERNAL_API_KEY =
    'test-internal-key-at-least-32-characters';
  jest
    .mocked(getVerifiedCoreSession)
    .mockResolvedValue({
      userId: 'real-id',
      username: 'Alice',
      role: 'AcceptedUser',
    } as never);
  global.fetch = jest
    .fn()
    .mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ text: 'hello 👋' }),
    });
});

test('forwards verified identity and delegates generation to Django', async () => {
  expect(await emojifyWithAi('forged', 'hello', false)).toBe('hello 👋');
  expect(fetch).toHaveBeenCalledWith(
    new URL('http://django.test/internal/emojify/generate'),
    expect.objectContaining({
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify({ text: 'hello', frequent: false }),
      headers: expect.objectContaining({
        'X-MGCK-Core-User-Id': 'real-id',
        'X-MGCK-Core-Username': 'Alice',
        'X-MGCK-Core-Role': 'AcceptedUser',
      }),
    })
  );
});

test('anonymous requests do not reach Django', async () => {
  jest.mocked(getVerifiedCoreSession).mockResolvedValue(null);
  expect(await emojifyWithAi('forged', 'hello', false)).toContain('logged in');
  expect(fetch).not.toHaveBeenCalled();
});

test('disabled backend returns an availability message', async () => {
  jest.mocked(fetch).mockResolvedValue({ status: 503 } as Response);
  expect(await emojifyWithAi('forged', 'hello', false)).toContain('disabled');
});

test('non-admin cannot change availability', async () => {
  const form = new FormData();
  form.set('enabled', 'false');
  await expect(changeAiAvailability(form)).rejects.toThrow('Administrator');
  expect(fetch).not.toHaveBeenCalled();
});

test('admin switch changes are sent to Django', async () => {
  jest
    .mocked(getVerifiedCoreSession)
    .mockResolvedValue({
      userId: 'admin-id',
      username: 'Admin',
      role: 'Admin',
    } as never);
  const form = new FormData();
  form.set('enabled', 'false');
  await changeAiAvailability(form);
  expect(fetch).toHaveBeenCalledWith(
    new URL('http://django.test/internal/emojify/control'),
    expect.objectContaining({ method: 'PATCH', body: '{"enabled":false}' })
  );
});

test('monitoring fails when the backend is unavailable', async () => {
  jest.mocked(fetch).mockResolvedValue({ ok: false, status: 503 } as Response);
  await expect(getAiMonitoring('2026-09-01', '2026-09-06')).rejects.toThrow(
    'unavailable'
  );
});
