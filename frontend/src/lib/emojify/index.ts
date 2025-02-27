import { DEFAULT_EMOJIS } from '@/lib/consts';
import { randomChoice } from '@/lib/utils';

export const defaultEmojis = () => DEFAULT_EMOJIS.join(' ');

export const emojifyText = (message: string, emojisInput: string) => {
  if (!message) return 'Emojified message will appear here';
  if (!emojisInput) return message;
  const words = message.split(' ').filter((word) => word.length > 0);
  const emojis = emojisInput.split(' ').filter((emoji) => emoji.length > 1);
  const wordsWithEmojis = words.map(
    (word) => `${word} ${randomChoice(emojis)}`
  );
  return wordsWithEmojis.join(' ');
};
