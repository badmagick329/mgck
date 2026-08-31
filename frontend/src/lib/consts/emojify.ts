export const DEFAULT_EMOJIS = [
  '😫',
  '😃',
  '😭',
  '🥰',
  '😍',
  '🤓',
  '🤯',
  '😯',
  '🫣',
  '😤',
  '😳',
  '😬',
  '🙄',
  '👀',
  '🔥',
  '🤪',
  '😑',
  '😴',
  '😎',
  '😏',
  '🤮',
  '😒',
  '🤠',
  '🤡',
  '💀',
  '😇',
];

export const EMOJI_PACKS = {
  original: {
    label: 'Original',
    description: 'The original grab bag. Results may be unhinged.',
    emojis: DEFAULT_EMOJIS,
  },
  reactions: {
    label: 'Reactions',
    description: 'Faces and gestures for everyday messages.',
    emojis: ['😂', '😭', '😅', '🤔', '🙄', '😳', '👀', '👍', '👏', '💀'],
  },
  cute: {
    label: 'Cute',
    description: 'Soft, cheerful, and aggressively adorable.',
    emojis: ['🥰', '😊', '🥹', '💕', '✨', '🌸', '🫶', '🐣', '🎀', '🍓'],
  },
  hype: {
    label: 'Hype',
    description: 'For announcements, victories, and shouting.',
    emojis: ['🔥', '🚀', '💥', '⚡', '🎉', '🙌', '💪', '🏆', '📣', '‼️'],
  },
  hearts: {
    label: 'Hearts',
    description: 'An unreasonable number of ways to say love.',
    emojis: ['❤️', '🩷', '🧡', '💛', '💚', '🩵', '💙', '💜', '🤍', '💖'],
  },
  deadpan: {
    label: 'Deadpan',
    description: 'Dry reactions for messages that deserve them.',
    emojis: ['😐', '😑', '🙃', '🫠', '🧍', '👍', '🙂', '🤨', '😶', '☕'],
  },
} as const;

export type EmojiPackId = keyof typeof EMOJI_PACKS | 'custom';

export const EMOJI_INTENSITIES = {
  light: {
    label: 'Light',
    description: 'A small sprinkle.',
    probability: 0.18,
  },
  balanced: {
    label: 'Balanced',
    description: 'Enough to notice.',
    probability: 0.45,
  },
  chaos: {
    label: 'Chaos',
    description: 'One after every word.',
    probability: 1,
  },
} as const;

export type EmojiIntensity = keyof typeof EMOJI_INTENSITIES;

export const MAX_AI_INPUT = 1500;
