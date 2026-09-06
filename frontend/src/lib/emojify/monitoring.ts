import 'server-only';
import { z } from 'zod';
import { getVerifiedCoreSession } from '@/lib/account/verified-session';

/** Keep Core identity assertions on the trusted server-to-server connection. */
export async function aiRequest(path: string, method = 'GET', data?: unknown) {
  const session = await getVerifiedCoreSession();
  const key = process.env.NEXT_DJANGO_INTERNAL_API_KEY;
  if (!session || !key || key.length < 32)
    throw new Error('AI service unavailable');
  return fetch(new URL(`/internal/emojify/${path}`, process.env.BASE_URL), {
    method,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'X-MGCK-Core-User-Id': encodeURIComponent(session.userId),
      'X-MGCK-Core-Username': encodeURIComponent(session.username),
      'X-MGCK-Core-Role': encodeURIComponent(session.role),
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    signal: AbortSignal.timeout(30000),
  });
}

export async function setAiEnabled(enabled: boolean) {
  const response = await aiRequest('control', 'PATCH', { enabled });
  if (!response.ok) throw new Error('Could not update AI availability');
}

const monitoringSchema = z.object({
  enabled: z.boolean(),
  rows: z.array(
    z.object({
      day: z.string(),
      user_id: z.string(),
      username: z.string(),
      requests: z.number(),
      succeeded: z.number(),
      failed: z.number(),
      pending: z.number(),
      characters: z.number(),
      prompt_tokens: z.number().nullable(),
      output_tokens: z.number().nullable(),
      total_tokens: z.number().nullable(),
    })
  ),
});

export async function getAiMonitoring(start: string, end: string) {
  const response = await aiRequest(
    `usage?${new URLSearchParams({ start, end })}`
  );
  if (!response.ok) throw new Error('AI monitoring unavailable');
  return monitoringSchema.parse(await response.json());
}
