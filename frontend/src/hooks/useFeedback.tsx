'use client';

import {
  getFeedbacksAction,
  createFeedbackAction,
  deleteFeedbackAction,
} from '@/actions/feedback';
import {
  FeedbackError,
  FeedbackCreationSuccess,
  FeedbacksSuccess,
} from '@/lib/types/feedback';

export function useFeedback() {
  const getFeedback = async (): Promise<FeedbacksSuccess | FeedbackError> => {
    return await getFeedbacksAction();
  };

  const createFeedback = async ({
    comment,
  }: {
    comment: string;
  }): Promise<FeedbackError | FeedbackCreationSuccess> => {
    return await createFeedbackAction({ comment });
  };

  const deleteFeedback = async ({
    feedbackId,
  }: {
    feedbackId: number;
  }): Promise<FeedbackError | { success: boolean }> => {
    return await deleteFeedbackAction({ feedbackId });
  };

  return {
    getFeedback,
    createFeedback,
    deleteFeedback,
  };
}
