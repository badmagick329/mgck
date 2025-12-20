'use server';

import { ParsedToken } from '@/lib/account/parsed-token';
import { API_MILESTONES } from '@/lib/consts/urls';
import {
  ClientMilestone,
  serverMilestoneListSchema,
  serverMilestoneSchema,
} from '@/lib/types/milestones';

const BASE_URL = process.env.BASE_URL;

export async function listMilestonesAction() {
  const token = await ParsedToken.createFromCookie();
  const username = token.name();
  if (!username) {
    return { error: 'User not logged in' };
  }

  const apiUrl = new URL(`${BASE_URL}${API_MILESTONES}`);
  apiUrl.searchParams.append('username', token.name());
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) {
      console.error('Failed to fetch milestones', res.statusText);
      return { error: 'Failed to fetch milestones' };
    }
    const data = await res.json();
    const parsed = serverMilestoneListSchema.safeParse(data);
    if (!parsed.success) {
      return {
        error: 'Failed to parse milestones',
      };
    }

    return { data: parsed.data };
  } catch (e) {
    console.error('Error fetching milestones', e);
    return {
      error: 'Error fetching milestones',
    };
  }
}

export async function createMilestoneAction(milestone: ClientMilestone) {
  const token = await ParsedToken.createFromCookie();
  const username = token.name();
  if (!username) {
    return { error: 'User not logged in' };
  }

  const apiUrl = new URL(`${BASE_URL}${API_MILESTONES}`);
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: milestone.timestamp,
        timezone: milestone.timezone,
        username: username,
        event_name: milestone.name,
      }),
    });
    if (!res.ok) {
      console.error('Failed to create milestone', res.statusText);
      return { error: 'Failed to create milestone' };
    }
    const data = await res.json();
    const parsed = serverMilestoneSchema.safeParse(data);
    if (!parsed.success) {
      return {
        error: 'Failed to parse milestone result',
      };
    }

    return { data: parsed.data };
  } catch (e) {
    console.error('Error creating milestone', e);
    return {
      error: 'Error creating milestone',
    };
  }
}

export async function removeMilestoneAction(milestoneName: string) {
  const token = await ParsedToken.createFromCookie();
  const username = token.name();
  if (!username) {
    return { error: 'User not logged in' };
  }

  const apiUrl = new URL(`${BASE_URL}${API_MILESTONES}${milestoneName}`);
  try {
    const res = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
      }),
    });
    if (!res.ok) {
      console.error('Failed to delete milestone', res.statusText);
      return { error: 'Failed to delete milestone' };
    }

    return {};
  } catch (e) {
    console.error('Error deleting milestone', e);
    return {
      error: 'Error deleting milestone',
    };
  }
}
