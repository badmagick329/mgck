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
import { headers } from 'next/headers';

const BASE_URL = process.env.CORE_API_BASE_URL;
const rateLimit = new RateLimit(3, 60 * 30);

export async function getFeedbacksAction(): Promise<
  FeedbacksSuccess | FeedbackError
> {
  const session = await getVerifiedCoreSession();
  if (session?.role !== ADMIN_ROLE) {
    return createError({
      status: 403,
      error: 'Unauthorized',
    });
  }

  const resp = await fetch(`${BASE_URL}${API_FEEDBACK}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: 'no-store',
  });
  return await asFeedbacksSuccessOrError(resp);
}

export async function createFeedbackAction({
  comment,
  createdBy,
  originPath,
}: {
  comment: string;
  createdBy: string;
  originPath: string;
}): Promise<FeedbackCreationSuccess | FeedbackError> {
  const rateLimitError = await limitExceededCheck();
  if (rateLimitError) {
    return rateLimitError;
  }

  const resp = await fetch(`${BASE_URL}${API_FEEDBACK}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment, createdBy: createdBy.trim(), originPath }),
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
  const ip = await getClientIp();
  if (ip) {
    const { success } = await rateLimit.tryIncrementAndGetCount(ip);
    if (!success) {
      return createError({
        status: 429,
        error: 'You have made too many requests. Please try again later.',
      });
    }
  } else {
    console.error('Error getting IP address');
  }
}

async function getClientIp(): Promise<string | undefined> {
  const headersObject = await headers();
  const forwardedFor = headersObject.get('x-forwarded-for');

  return (
    forwardedFor?.split(',')[0].trim() ||
    headersObject.get('x-real-ip')?.trim() ||
    undefined
  );
}
