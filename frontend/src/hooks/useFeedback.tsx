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
import { useCallback } from 'react';

export function useFeedback() {
  const getFeedback = useCallback(async (): Promise<
    FeedbacksSuccess | FeedbackError
  > => {
    return await getFeedbacksAction();
  }, []);

  const createFeedback = useCallback(
    async ({
      comment,
      createdBy,
      originPath,
    }: {
      comment: string;
      createdBy: string;
      originPath: string;
    }): Promise<FeedbackError | FeedbackCreationSuccess> => {
      return await createFeedbackAction({ comment, createdBy, originPath });
    },
    []
  );

  const deleteFeedback = useCallback(
    async ({
      feedbackId,
    }: {
      feedbackId: number;
    }): Promise<FeedbackError | { success: boolean }> => {
      return await deleteFeedbackAction({ feedbackId });
    },
    []
  );

  return {
    getFeedback,
    createFeedback,
    deleteFeedback,
  };
}
