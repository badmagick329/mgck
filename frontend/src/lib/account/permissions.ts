import { NEW_USER_ROLE } from '../consts/account';
import { VerifiedCoreSession } from './core-token';

export const canUseAiEmojis = (session: VerifiedCoreSession | null) => {
  return Boolean(session?.role && session.role !== NEW_USER_ROLE);
};

export const canUseShortener = (session: VerifiedCoreSession | null) => {
  return Boolean(session?.role && session.role !== NEW_USER_ROLE);
};
