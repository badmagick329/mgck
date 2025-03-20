import {
  FeedbacksSuccess,
  FeedbackError,
  feedbackSchema,
  FeedbackCreationSuccess,
} from '../types/feedback';

export async function asFeedbacksSuccessOrError(
  response: Response
): Promise<FeedbacksSuccess | FeedbackError> {
  try {
    const data = await response.json();
    if (!response.ok) {
      return {
        type: 'error',
        status: response.status,
        data: {
          errors: data?.errors || ['Unknown error occurred'],
        },
      };
    }

    return {
      type: 'success',
      status: response.status,
      data: {
        feedbacks: data.map((d: unknown) => {
          const parsed = feedbackSchema.safeParse(d);
          if (parsed.success) {
            return {
              id: parsed.data.id,
              comment: parsed.data.comment,
              createdBy: parsed.data.createdBy,
              originPath: parsed.data.originPath,
              createdAt: parsed.data.createdAt,
            };
          }
          throw new Error('Invalid feedback data');
        }),
      },
    };
  } catch (e) {
    console.error('Error retrieving feedback:', e);
    return {
      type: 'error',
      status: response.status,
      data: { errors: ['Error retrieving feedback'] },
    };
  }
}
export async function asCreationSuccessOrError(
  response: Response
): Promise<FeedbackError | FeedbackCreationSuccess> {
  try {
    const data = await response.json();
    if (!response.ok) {
      return {
        type: 'error',
        status: response.status,
        data: {
          errors: data.errors || ['Unknown error occurred'],
        },
      };
    }

    return {
      type: 'success',
      status: response.status,
      data: {
        created: {
          id: data.id,
          comment: data.comment,
          createdBy: data.createdBy,
          originPath: data.originPath,
          createdAt: data.createdAt,
        },
      },
    };
  } catch (e) {
    console.error('Error creating feedback:', e);
    return {
      type: 'error',
      status: response.status,
      data: { errors: ['Error creating feedback'] },
    };
  }
}
