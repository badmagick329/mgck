import { z } from 'zod';

const credentialsErrorSchema = z.object({
  code: z.string(),
  description: z.string(),
});
export const credentialsErrorResponseSchema = z.array(credentialsErrorSchema);
export type CredentialsErrorResponse = z.infer<
  typeof credentialsErrorResponseSchema
>;

const problemErrorSchema = z.record(z.array(z.string()));
export const problemErrorResponseSchema = z.object({
  errors: z.array(problemErrorSchema),
});
export const apiErrorSchema = z.union([
  credentialsErrorResponseSchema,
  z.array(problemErrorSchema),
]);
export type ApiError = z.infer<typeof apiErrorSchema>;

export const errorResponseSchema = z.object({
  type: z.literal('error'),
  status: z.number(),
  errors: apiErrorSchema,
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export const ADMIN_ROLE = 'Admin';
export const NEW_USER_ROLE = 'NewUser';
export const ACCEPTED_USER_ROLE = 'AcceptedUser';
const userRoleSchema = z.enum([ADMIN_ROLE, NEW_USER_ROLE, ACCEPTED_USER_ROLE]);

const successBaseSchema = z.object({
  type: z.literal('success'),
  status: z.number(),
});

export const roleResponseSchema = successBaseSchema.extend({
  data: z.object({
    role: userRoleSchema,
    username: z.string(),
  }),
});
export type RoleResponse = z.infer<typeof roleResponseSchema>;

export const messageResponseSchema = successBaseSchema.extend({
  data: z.object({
    message: z.string(),
  }),
});
export type MessageResponse = z.infer<typeof messageResponseSchema>;

const usersResponseDataSchema = z.array(
  z.object({
    username: z.string(),
    role: z.string(),
  })
);

export const usersResponseSchema = successBaseSchema.extend({
  data: usersResponseDataSchema,
});

export type UsersResponseData = z.infer<typeof usersResponseDataSchema>;
export type UsersResponse = z.infer<typeof usersResponseSchema>;

export const successResponseSchema = z.union([
  roleResponseSchema,
  messageResponseSchema,
  usersResponseSchema,
]);
export type SuccessResponse = z.infer<typeof successResponseSchema>;

export const aspAuthResponseSchema = z.union([
  errorResponseSchema,
  successResponseSchema,
]);
export type AspAuthResponse = z.infer<typeof aspAuthResponseSchema>;
