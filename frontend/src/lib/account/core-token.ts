import { jwtVerify } from 'jose';
import { z } from 'zod';

export const NAME_IDENTIFIER_CLAIM =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
export const NAME_CLAIM =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';

const coreClaimsSchema = z.object({
  [NAME_IDENTIFIER_CLAIM]: z.string().trim().min(1).max(255),
  [NAME_CLAIM]: z.string().trim().min(1).max(255),
  role: z.string().trim().min(1).max(255),
  exp: z.number().int().positive(),
});

export type VerifiedCoreSession = {
  accessToken: string;
  userId: string;
  username: string;
  role: string;
  expiresAt: number;
};

export type CoreTokenVerification =
  | { ok: true; session: VerifiedCoreSession }
  | { ok: false; reason: 'configuration' | 'invalid' };

export async function verifyCoreAccessToken(
  token?: string
): Promise<CoreTokenVerification> {
  const issuer = process.env.JWT__Issuer;
  const audience = process.env.JWT__Audience;
  const signingKey = process.env.JWT__SigningKey;

  if (!issuer || !audience || !signingKey) {
    return { ok: false, reason: 'configuration' };
  }
  if (!token) {
    return { ok: false, reason: 'invalid' };
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(signingKey),
      {
        algorithms: ['HS256'],
        issuer,
        audience,
        clockTolerance: 0,
        requiredClaims: ['exp', NAME_IDENTIFIER_CLAIM, NAME_CLAIM],
      }
    );
    const parsed = coreClaimsSchema.safeParse(payload);
    if (!parsed.success) {
      return { ok: false, reason: 'invalid' };
    }

    return {
      ok: true,
      session: {
        accessToken: token,
        userId: parsed.data[NAME_IDENTIFIER_CLAIM],
        username: parsed.data[NAME_CLAIM],
        role: parsed.data.role,
        expiresAt: parsed.data.exp,
      },
    };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

export function isCoreSessionExpiring(
  session: VerifiedCoreSession,
  now = Date.now()
) {
  return session.expiresAt < Math.floor(now / 1000) + 10;
}
