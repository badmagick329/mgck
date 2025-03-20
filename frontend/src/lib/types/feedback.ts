import { z } from 'zod';

const successBaseSchema = z.object({
  type: z.literal('success'),
  status: z.number(),
});

const errorBaseSchema = z.object({
  type: z.literal('error'),
  status: z.number(),
});

export const feedbackSchema = z.object({
  id: z.number(),
  comment: z.string(),
  createdBy: z.string(),
  originPath: z.string(),
  createdAt: z.string(),
});

export type Feedback = z.infer<typeof feedbackSchema>;

export const feedbacksSuccessSchema = successBaseSchema.extend({
  data: z.object({ feedbacks: z.array(feedbackSchema) }),
});

export type FeedbacksSuccess = z.infer<typeof feedbacksSuccessSchema>;

export const feedbackCreationSuccessSchema = successBaseSchema.extend({
  data: z.object({ created: feedbackSchema }),
});

export type FeedbackCreationSuccess = z.infer<
  typeof feedbackCreationSuccessSchema
>;

export const feedbackErrorSchema = errorBaseSchema.extend({
  data: z.object({
    errors: z.array(z.string()),
  }),
});

export type FeedbackError = z.infer<typeof feedbackErrorSchema>;
