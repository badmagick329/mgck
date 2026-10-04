import { z } from 'zod';

export const FEEDBACK_COMMENT_MAX = 4000;
export const FEEDBACK_NAME_MAX = 200;
export const FEEDBACK_PATH_MAX = 2048;

// Validate the raw lengths before trimming; padding cannot bypass storage bounds.
export const feedbackInputSchema = z.object({
  comment: z.string().max(FEEDBACK_COMMENT_MAX).trim().min(1),
  createdBy: z.string().max(FEEDBACK_NAME_MAX).trim(),
  originPath: z.string().max(FEEDBACK_PATH_MAX).trim().min(1),
});
