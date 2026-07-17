'use server';

import { API_MILESTONES } from '@/lib/consts/urls';
import { getVerifiedCoreSession } from '@/lib/account/verified-session';
import {
  milestoneSyncResponseSchema,
  MilestoneSyncWireRecord,
  MilestoneSyncResult,
  StoredMilestone,
  storedMilestoneResponseSchema,
  storedMilestoneSnapshotSchema,
} from '@/lib/types/milestones';

type MilestoneAuthenticationResult =
  | { ok: true; data: Record<string, string> }
  | {
      ok: false;
      kind: 'unauthenticated' | 'transient';
      error: string;
    };

export async function syncMilestonesAction(
  records: StoredMilestone[]
): Promise<MilestoneSyncResult> {
  const parsedRecords = storedMilestoneSnapshotSchema.safeParse(records);
  if (!parsedRecords.success) {
    return {
      ok: false,
      kind: 'invalid',
      error: 'Invalid milestone snapshot',
    };
  }
  const authResult = await getMilestoneAuthenticationHeaders();
  if (!authResult.ok) {
    return {
      ok: false,
      kind: authResult.kind,
      error: authResult.error,
    };
  }

  const url = milestoneApiUrl('sync');
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authResult.data,
      },
      body: JSON.stringify({
        records: parsedRecords.data.map(storedMilestoneToWire),
      }),
      cache: 'no-store',
    });
    if (!response.ok) {
      const kind =
        response.status === 409
          ? 'conflict'
          : response.status === 401 ||
              response.status === 403 ||
              response.status === 408 ||
              response.status === 429 ||
              response.status >= 500
            ? 'transient'
            : 'invalid';
      return {
        ok: false,
        kind,
        error: response.statusText || 'Milestone sync failed',
      };
    }
    const result = milestoneSyncResponseSchema.safeParse(await response.json());
    if (!result.success) {
      return {
        ok: false,
        kind: 'invalid',
        error: 'Invalid milestone sync response',
      };
    }
    const converted = result.data.records.map(wireToStoredMilestone);
    const parsedResponse = storedMilestoneResponseSchema.safeParse(converted);
    return parsedResponse.success
      ? { ok: true, data: parsedResponse.data }
      : {
          ok: false,
          kind: 'invalid',
          error: 'Invalid milestone sync response',
        };
  } catch {
    return {
      ok: false,
      kind: 'transient',
      error: 'Milestone sync request failed',
    };
  }
}

async function getMilestoneAuthenticationHeaders(): Promise<MilestoneAuthenticationResult> {
  const session = await getVerifiedCoreSession();
  if (!session) {
    return {
      ok: false,
      kind: 'unauthenticated',
      error: 'User not logged in',
    };
  }
  const internalKey = process.env.NEXT_DJANGO_INTERNAL_API_KEY;
  if (!internalKey || internalKey.length < 32) {
    console.error('Milestone internal authentication is not configured');
    return {
      ok: false,
      kind: 'transient',
      error: 'Milestone service unavailable',
    };
  }
  try {
    return {
      ok: true,
      data: {
        Authorization: `Bearer ${internalKey}`,
        'X-MGCK-Core-User-Id': encodeURIComponent(session.userId),
        'X-MGCK-Core-Username': encodeURIComponent(session.username),
      },
    };
  } catch {
    return {
      ok: false,
      kind: 'unauthenticated',
      error: 'Invalid account identity',
    };
  }
}

const milestoneApiUrl = (suffix = '') =>
  new URL(`${process.env.BASE_URL}${API_MILESTONES}${suffix}`);

const storedMilestoneToWire = (
  milestone: StoredMilestone
): MilestoneSyncWireRecord => ({
  public_id: milestone.publicId,
  name: milestone.name,
  timestamp: milestone.timestamp,
  timezone: milestone.timezone,
  color: milestone.color,
  updated_at: milestone.updatedAt,
  deleted_at: milestone.deletedAt,
});

const wireToStoredMilestone = (
  milestone: MilestoneSyncWireRecord
): StoredMilestone => ({
  publicId: milestone.public_id,
  name: milestone.name,
  timestamp: milestone.timestamp,
  timezone: milestone.timezone,
  color: milestone.color,
  updatedAt: milestone.updated_at,
  deletedAt: milestone.deleted_at,
});
