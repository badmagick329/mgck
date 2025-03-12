import { NEW_USER_ROLE } from '../consts/auth';
import { ParsedToken } from './parsed-token';

export const canUseAiEmojis = (token: ParsedToken) => {
  return token.role() !== '' && token.role() !== NEW_USER_ROLE;
};
