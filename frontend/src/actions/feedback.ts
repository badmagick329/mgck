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

const BASE_URL = process.env.CORE_API_BASE_URL;

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
}: {
  comment: string;
  createdBy: string;
}): Promise<FeedbackCreationSuccess | FeedbackError> {
  const resp = await fetch(`${BASE_URL}${API_FEEDBACK}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment, createdBy: createdBy.trim() }),
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
