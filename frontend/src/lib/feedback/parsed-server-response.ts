import {
  FeedbacksSuccess,
  FeedbackError,
  feedbackSchema,
  feedbackPageSchema,
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
          errors: responseErrors(data),
        },
      };
    }

    return {
      type: 'success',
      status: response.status,
      data: feedbackPageSchema.parse(data),
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
          errors: responseErrors(data),
        },
      };
    }

    return {
      type: 'success',
      status: response.status,
      data: {
        created: feedbackSchema.parse(data),
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

function responseErrors(data: { errors?: unknown }): string[] {
  const errors = data?.errors;
  const candidates = Array.isArray(errors)
    ? errors
    : errors && typeof errors === 'object'
      ? Object.values(errors).flat()
      : [];
  const messages = candidates.filter(
    (value): value is string => typeof value === 'string'
  );
  return messages.length ? messages : ['Unknown error occurred'];
}
