'use server';

import { API_MILESTONES } from '@/lib/consts/urls';
import { serverMilestoneToClient } from '@/lib/milestones';
import { ApiResponse } from '@/lib/types';
import {
  ClientMilestone,
  milestoneSyncResponseSchema,
  MilestoneSyncWireRecord,
  ServerMilestone,
  serverMilestoneListSchema,
  serverMilestoneSchema,
  StoredMilestone,
  storedMilestoneResponseSchema,
  storedMilestoneSnapshotSchema,
} from '@/lib/types/milestones';
import { cookies } from 'next/headers';
import { Schema } from 'zod';

export async function listMilestonesAction(): Promise<
  ApiResponse<ClientMilestone[]>
> {
  const authResult = await getAuthenticationToken();
  if (!authResult.ok) {
    return authResult;
  }

  const url = milestoneApiUrl();
  const result = await fetchAndParse<ServerMilestone[]>(
    url,
    serverMilestoneListSchema,
    { headers: authorizationHeaders(authResult.data) }
  );

  return result.ok
    ? {
        ok: true,
        data: result.data.map(serverMilestoneToClient),
      }
    : {
        ok: false,
        error: 'Failed to fetch milestones',
      };
}

export async function createMilestoneAction(
  milestone: ClientMilestone
): Promise<ApiResponse<ClientMilestone>> {
  const authResult = await getAuthenticationToken();
  if (!authResult.ok) {
    return authResult;
  }

  const url = milestoneApiUrl();
  const result = await fetchAndParse<ServerMilestone>(
    url,
    serverMilestoneSchema,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authorizationHeaders(authResult.data),
      },
      body: JSON.stringify({
        timestamp: milestone.timestamp,
        timezone: milestone.timezone,
        event_name: milestone.name,
        color: milestone.color,
      }),
    }
  );

  return result.ok
    ? {
        ok: true,
        data: serverMilestoneToClient(result.data),
      }
    : {
        ok: false,
        error: 'Failed to create milestone',
      };
}

export async function deleteMilestoneAction(
  milestoneName: string
): Promise<ApiResponse<'success'>> {
  const authResult = await getAuthenticationToken();
  if (!authResult.ok) {
    return authResult;
  }

  const url = milestoneApiUrl(milestoneName);

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authorizationHeaders(authResult.data),
      },
    });

    return res.ok
      ? { ok: true, data: 'success' }
      : { ok: false, error: 'Failed to delete milestone' };
  } catch (e) {
    return { ok: false, error: 'Failed to delete milestone' };
  }
}

export async function updateMilestoneAction(
  milestoneName: string,
  newMilestone: Partial<ClientMilestone>
): Promise<ApiResponse<ClientMilestone>> {
  const authResult = await getAuthenticationToken();
  if (!authResult.ok) {
    return authResult;
  }

  const url = milestoneApiUrl(milestoneName);
  const result = await fetchAndParse<ServerMilestone>(
    url,
    serverMilestoneSchema,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authorizationHeaders(authResult.data),
      },
      body: JSON.stringify({
        new_event_name: newMilestone.name || null,
        new_timestamp: newMilestone.timestamp || null,
        new_timezone: newMilestone.timezone || null,
        new_color: newMilestone.color || null,
      }),
    }
  );

  return result.ok
    ? {
        ok: true,
        data: serverMilestoneToClient(result.data),
      }
    : {
        ok: false,
        error: 'Failed to update milestone',
      };
}

export async function syncMilestonesAction(
  records: StoredMilestone[]
): Promise<ApiResponse<StoredMilestone[]>> {
  const parsedRecords = storedMilestoneSnapshotSchema.safeParse(records);
  if (!parsedRecords.success) {
    return { ok: false, error: 'Invalid milestone snapshot' };
  }
  const authResult = await getAuthenticationToken();
  if (!authResult.ok) {
    return authResult;
  }

  const url = milestoneApiUrl('sync');
  const result = await fetchAndParse<{ records: MilestoneSyncWireRecord[] }>(
    url,
    milestoneSyncResponseSchema,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authorizationHeaders(authResult.data),
      },
      body: JSON.stringify({
        records: parsedRecords.data.map(storedMilestoneToWire),
      }),
      cache: 'no-store',
    }
  );
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  const converted = result.data.records.map(wireToStoredMilestone);
  const parsedResponse = storedMilestoneResponseSchema.safeParse(converted);
  return parsedResponse.success
    ? { ok: true, data: parsedResponse.data }
    : { ok: false, error: 'Invalid milestone sync response' };
}

async function getAuthenticationToken(): Promise<ApiResponse<string>> {
  const token = (await cookies()).get('token')?.value;
  if (!token) {
    return { ok: false, error: 'User not logged in' };
  }
  return { ok: true, data: token };
}

const authorizationHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

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

async function fetchAndParse<T>(
  url: URL,
  schema: Schema,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      return { ok: false, error: res.statusText };
    }

    const data = await res.json();

    const parsed = schema.safeParse(data);
    return parsed.success
      ? { ok: true, data: parsed.data as T }
      : {
          ok: false,
          error: parsed.error.message,
        };
  } catch (error) {
    return {
      ok: false,
      error: String(error),
    };
  }
}
