'use server';

import { getVerifiedCoreSession } from '@/lib/account/verified-session';
import { ADMIN_ROLE } from '@/lib/consts/account';
import { API_DELETE_FEEDBACK, API_FEEDBACK } from '@/lib/consts/urls';
import {
  asCreationSuccessOrError,
  asFeedbacksSuccessOrError,
} from '@/lib/feedback/parsed-server-response';
import {
  FeedbackError,
  FeedbackCreationSuccess,
  FeedbacksSuccess,
} from '@/lib/types/feedback';
import { RateLimit } from '@/lib/utils/rate-limit';
import { getTrustedClient } from '@/lib/utils/trusted-client';
import { createHash } from 'node:crypto';
import { feedbackInputSchema } from '@/lib/feedback/input';

const BASE_URL = process.env.CORE_API_BASE_URL;
const rateLimit = new RateLimit(3, 60 * 30, 'feedback:client:');
const aggregateLimit = new RateLimit(30, 60 * 30, 'feedback:aggregate:');

export async function getFeedbacksAction(
  beforeId?: number
): Promise<FeedbacksSuccess | FeedbackError> {
  const session = await getVerifiedCoreSession();
  if (session?.role !== ADMIN_ROLE) {
    return createError({
      status: 403,
      error: 'Unauthorized',
    });
  }

  if (
    beforeId !== undefined &&
    (!Number.isSafeInteger(beforeId) || beforeId < 1 || beforeId > 2147483647)
  ) {
    return createError({ status: 400, error: 'Invalid feedback cursor.' });
  }
  const query = beforeId === undefined ? '' : `?beforeId=${beforeId}`;
  const resp = await fetch(`${BASE_URL}${API_FEEDBACK}${query}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: 'no-store',
  });
  return await asFeedbacksSuccessOrError(resp);
}

export async function createFeedbackAction(input: {
  comment: string;
  createdBy: string;
  originPath: string;
}): Promise<FeedbackCreationSuccess | FeedbackError> {
  const parsed = feedbackInputSchema.safeParse(input);
  if (!parsed.success) {
    return createError({
      status: 400,
      error:
        'Invalid feedback. Limit comments to 4,000 characters, names to 200, and page paths to 2,048.',
    });
  }
  const rateLimitError = await limitExceededCheck();
  if (rateLimitError) {
    return rateLimitError;
  }

  const resp = await fetch(`${BASE_URL}${API_FEEDBACK}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(parsed.data),
  });

  return await asCreationSuccessOrError(resp);
}

export async function deleteFeedbackAction({
  feedbackId,
}: {
  feedbackId: number;
}): Promise<{ success: boolean } | FeedbackError> {
  const session = await getVerifiedCoreSession();
  if (session?.role !== ADMIN_ROLE) {
    return createError({
      status: 403,
      error: 'Unauthorized',
    });
  }

  const resp = await fetch(`${BASE_URL}${API_DELETE_FEEDBACK}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify({ id: feedbackId }),
  });

  if (resp.status === 204) {
    return { success: true };
  } else {
    return createError({
      status: resp.status,
      error: 'Failed to delete feedback',
    });
  }
}

function createError({
  status,
  error,
}: {
  status: number;
  error: string;
}): FeedbackError {
  return {
    type: 'error',
    status,
    data: {
      errors: [error],
    },
  };
}

async function limitExceededCheck(): Promise<FeedbackError | undefined> {
  const ip = await getTrustedClient();
  if (!ip) {
    return createError({
      status: 503,
      error: 'Feedback is temporarily unavailable.',
    });
  }
  const clientKey = createHash('sha256').update(ip).digest('hex');
  for (const [limiter, key] of [
    [rateLimit, clientKey],
    [aggregateLimit, 'all'],
  ] as const) {
    const { success } = await limiter.tryIncrementAndGetCount(key);
    if (!success) {
      return createError({
        status: 429,
        error: 'You have made too many requests. Please try again later.',
      });
    }
  }
}
