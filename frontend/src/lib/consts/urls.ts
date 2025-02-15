export const GFYS_BASE = '/gfys';
export const KPOP_BASE = '/kpop';
export const URL_SHORTENER_BASE = '/shorten';
export const EMOJIFY_BASE = '/emojify';
export const DISCORD_GIFS = '/discordgifs';
const ACCOUNT_BASE = '/account';
export const ACCOUNT_LOGIN = `${ACCOUNT_BASE}/login`;
export const ACCOUNT_USER_HOME = `${ACCOUNT_BASE}/home`;

const DJANGO_API_BASE = '/api';
export const API_GFYS = `${DJANGO_API_BASE}/gfys`;
export const API_GFY_ACCOUNTS = `${DJANGO_API_BASE}/accounts`;
export const API_GFY_VIEWS = `${DJANGO_API_BASE}/gfy/views`;
export const API_SHORTENER_SHORTEN = `${DJANGO_API_BASE}/urlshortener/shorten/`;
export const API_SHORTENER_SHORTENED = `${DJANGO_API_BASE}/urlshortener/shortened/`;
export const API_KPOP = `${DJANGO_API_BASE}/kpopcomebacks`;

const AUTH_BASE = '/api/auth';
export const API_AUTH_STATUS = `${AUTH_BASE}/status`;
export const API_LOGIN = `${AUTH_BASE}/login`;
export const API_REFRESH = `${AUTH_BASE}/refresh`;
export const API_REGISTER = `${AUTH_BASE}/register`;
export const API_USER_ROLE = `${AUTH_BASE}/role`;
export const API_SET_ROLES = `${AUTH_BASE}/setroles`;
