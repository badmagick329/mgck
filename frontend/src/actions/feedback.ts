'use server';

import { ParsedToken } from '@/lib/account/parsed-token';
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
  const token = ParsedToken.createFromCookie();
  if (token.role() !== ADMIN_ROLE) {
    return createError({
      status: 403,
      error: 'Unauthorized',
    });
  }

  const resp = await fetch(`${BASE_URL}${API_FEEDBACK}`);
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
  const token = ParsedToken.createFromCookie();
  if (token.role() !== ADMIN_ROLE) {
    return createError({
      status: 403,
      error: 'Unauthorized',
    });
  }

  const resp = await fetch(`${BASE_URL}${API_DELETE_FEEDBACK}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
  const ip = IP();
  console.log(`ip: ${ip}`);
  if (ip) {
    const { count, success } = await rateLimit.tryIncrementAndGetCount(ip);
    console.log(`count for ${ip}: ${count}`);
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

function IP(): string | undefined {
  const FALLBACK_IP_ADDRESS = undefined;
  const forwardedFor = headers().get('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0] ?? FALLBACK_IP_ADDRESS;
  }

  return headers().get('x-real-ip') ?? FALLBACK_IP_ADDRESS;
}
