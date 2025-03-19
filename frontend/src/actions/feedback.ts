'use server';

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
  const resp = await fetch(`${BASE_URL}${API_FEEDBACK}`);
  return await asFeedbacksSuccessOrError(resp);
}

export async function createFeedbackAction({
  comment,
}: {
  comment: string;
}): Promise<FeedbackCreationSuccess | FeedbackError> {
  const resp = await fetch(`${BASE_URL}${API_FEEDBACK}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment }),
  });
  return await asCreationSuccessOrError(resp);
}

export async function deleteFeedbackAction({
  feedbackId,
}: {
  feedbackId: number;
}): Promise<{ success: boolean } | FeedbackError> {
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
    return {
      type: 'error',
      status: resp.status,
      data: {
        errors: ['Error deleting feedback'],
      },
    };
  }
}
