'use server';

import { ParsedToken } from '@/lib/account/parsed-token';
import { API_MILESTONES } from '@/lib/consts/urls';
import { serverMilestoneToClient } from '@/lib/milestones';
import { ApiResponse } from '@/lib/types';
import {
  ClientMilestone,
  ServerMilestone,
  serverMilestoneListSchema,
  serverMilestoneSchema,
} from '@/lib/types/milestones';
import { Schema } from 'zod';

const BASE_URL = process.env.BASE_URL;

export async function listMilestonesAction(): Promise<
  ApiResponse<ClientMilestone[]>
> {
  const authResult = await isAuthenticated();
  if (!authResult.ok) {
    return authResult;
  }

  const url = new URL(`${BASE_URL}${API_MILESTONES}`);
  url.searchParams.append('username', authResult.data);

  const result = await fetchAndParse<ServerMilestone[]>(
    url,
    serverMilestoneListSchema
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
  const authResult = await isAuthenticated();
  if (!authResult.ok) {
    return authResult;
  }

  const url = new URL(`${BASE_URL}${API_MILESTONES}`);
  const result = await fetchAndParse<ServerMilestone>(
    url,
    serverMilestoneSchema,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: milestone.timestamp,
        timezone: milestone.timezone,
        username: authResult.data,
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

export async function removeMilestoneAction(
  milestoneName: string
): Promise<ApiResponse<'success'>> {
  const authResult = await isAuthenticated();
  if (!authResult.ok) {
    return authResult;
  }

  const url = new URL(`${BASE_URL}${API_MILESTONES}${milestoneName}`);

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: authResult.data,
      }),
    });

    return res.ok
      ? { ok: true, data: 'success' }
      : { ok: false, error: 'Failed to delete milestone' };
  } catch (e) {
    return { ok: false, error: 'Failed to delete milestone' };
  }
}

async function isAuthenticated(): Promise<ApiResponse<string>> {
  const token = await ParsedToken.createFromCookie();
  const username = token.name();
  if (!username) {
    return { ok: false, error: 'User not logged in' };
  }
  return { ok: true, data: username };
}

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
      ? { ok: true, data }
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
