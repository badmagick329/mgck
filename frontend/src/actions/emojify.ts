'use server';
import { ParsedToken } from '@/lib/account/parsed-token';
import { canUseAiEmojis } from '@/lib/account/permissions';
import { emojifyPrompt, generativeModel } from '@/lib/emojify';
import { RateLimit } from '@/lib/utils/rate-limit';
import { MAX_AI_INPUT } from '@/lib/consts/emojify';

const rateLimit = new RateLimit(20, 60);
const model = generativeModel();

export async function emojifyWithAi(username: string, text: string) {
  const token = ParsedToken.createFromCookie();
  if (!canUseAiEmojis(token)) {
    return 'You need to be logged in to use this feature.';
  }

  if (text.length > MAX_AI_INPUT) {
    return `Text is too long. Please provide text with less than ${MAX_AI_INPUT} characters.`;
  }
  if (!text.trim()) {
    text = 'You have to give me some text to emojify';
  }

  const { success } = await rateLimit.tryIncrementAndGetCount(username);

  if (!success) {
    return 'Rate limit exceeded. Please try again later.';
  }

  if (!model) {
    return "Couldn't load model 🥺";
  }

  try {
    const prompt = emojifyPrompt(text);
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating content:', error);
    return "Couldn't generate response 🥺";
  }
}
