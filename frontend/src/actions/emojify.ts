'use server';
import { getVerifiedCoreSession } from '@/lib/account/verified-session';
import { canUseAiEmojis } from '@/lib/account/permissions';
import { emojifyPrompt, generativeModel } from '@/lib/emojify/server';
import { RateLimit } from '@/lib/utils/rate-limit';
import { MAX_AI_INPUT } from '@/lib/consts/emojify';

const rateLimit = new RateLimit(20, 60, 'rate:emojify:', false);
const model = generativeModel();

export async function emojifyWithAi(
  _username: string,
  text: string,
  frequent: boolean
) {
  const session = await getVerifiedCoreSession();
  if (!canUseAiEmojis(session)) {
    return 'You need to be logged in to use this feature.';
  }

  if (text.length > MAX_AI_INPUT) {
    return `Text is too long. Please provide text with less than ${MAX_AI_INPUT} characters.`;
  }
  if (!text.trim()) {
    text = 'You have to give me some text to emojify';
  }

  const { success } = await rateLimit.tryIncrementAndGetCount(
    session!.username
  );

  if (!success) {
    return 'Rate limit exceeded. Please try again later.';
  }

  if (!model) {
    return "Couldn't load model 🥺";
  }

  try {
    const prompt = emojifyPrompt(text, frequent);
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    const status =
      error && typeof error === 'object' && 'status' in error
        ? error.status
        : undefined;
    console.error('Gemini content generation failed', { status });
    return "Couldn't generate response 🥺";
  }
}
