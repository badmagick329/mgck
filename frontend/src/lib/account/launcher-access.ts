import { NEW_USER_ROLE } from '@/lib/consts/account';
import { VerifiedCoreSession } from '@/lib/account/core-token';
import { canUseAiEmojis, canUseShortener } from './permissions';

export type LauncherAccess = {
  action: { href: string; label: string };
  status: string;
  secondaryAction?: { href: string; label: string };
};

const accountLoginFor = (path: string) =>
  `/account/login?returnTo=${encodeURIComponent(path)}`;

export function shortenerLauncherAccess(
  session: VerifiedCoreSession | null
): LauncherAccess {
  if (canUseShortener(session)) {
    return {
      action: { href: '/shorten', label: 'Open URL Shortener' },
      status: 'Your approved account can use this',
    };
  }
  if (session?.role === NEW_USER_ROLE) {
    return {
      action: { href: '/account/home', label: 'View approval status' },
      status: 'Awaiting approval',
    };
  }
  return {
    action: { href: accountLoginFor('/shorten'), label: 'Create account / Sign in' },
    status: 'Core account required',
  };
}

export function emojifyLauncherAccess(
  session: VerifiedCoreSession | null
): LauncherAccess {
  if (canUseAiEmojis(session)) {
    return {
      action: { href: '/emojify', label: 'Open Emojifier' },
      status: 'AI emoji suggestions unlocked',
    };
  }
  if (session?.role === NEW_USER_ROLE) {
    return {
      action: { href: '/emojify', label: 'Open Emojifier' },
      status: 'AI suggestions unlock after approval',
    };
  }
  return {
    action: { href: '/emojify', label: 'Open Emojifier' },
    status: 'Sign in and get approved for AI suggestions',
    secondaryAction: {
      href: accountLoginFor('/emojify'),
      label: 'Create account / Sign in',
    },
  };
}
