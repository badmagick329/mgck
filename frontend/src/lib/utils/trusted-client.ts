import { isIP } from 'node:net';
import { headers } from 'next/headers';
import 'server-only';

export async function getTrustedClient(): Promise<string | undefined> {
  const requestHeaders = await headers();
  // Dokploy's immediate Traefik ingress appends the network peer. Caller-
  // prepended values and X-Real-IP are not evidence of client identity.
  const peer = requestHeaders.get('x-forwarded-for')?.split(',').at(-1)?.trim();
  if (!peer || peer.includes('%') || !isIP(peer)) return undefined;
  // Equivalent IPv6 spellings must share the same admission budget.
  return isIP(peer) === 6 ? new URL(`http://[${peer}]`).hostname : peer;
}
