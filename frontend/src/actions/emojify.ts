'use server';
import { z } from 'zod';
import { getVerifiedCoreSession } from '@/lib/account/verified-session';
import { canUseAiEmojis } from '@/lib/account/permissions';
import { aiRequest } from '@/lib/emojify/monitoring';
import { MAX_AI_INPUT } from '@/lib/consts/emojify';

export async function emojifyWithAi(
  _username: string,
  text: string,
  frequent: boolean
) {
  const session = await getVerifiedCoreSession();
  if (!canUseAiEmojis(session))
    return 'You need to be logged in to use this feature.';
  if (
    !z
      .object({ text: z.string().max(MAX_AI_INPUT), frequent: z.boolean() })
      .safeParse({ text, frequent }).success
  ) {
    return `Please provide text with no more than ${MAX_AI_INPUT} characters.`;
  }
  try {
    const response = await aiRequest('generate', 'POST', { text, frequent });
    if (response.status === 429)
      return 'Rate limit exceeded. Please try again later.';
    if (response.status === 503)
      return 'AI emojis are currently disabled or unavailable.';
    if (!response.ok) return "Couldn't generate response 🥺";
    return z.object({ text: z.string() }).parse(await response.json()).text;
  } catch {
    return "Couldn't generate response 🥺";
  }
}
