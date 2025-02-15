'use server';

import {
  ErrorResponse,
  errorResponseSchema,
  MessageResponse,
  messageResponseSchema,
  RoleResponse,
  roleResponseSchema,
} from '@/lib/types/auth';
import { parsedServerResponse } from '@/lib/account/parsed-server-response';
import {
  API_APPROVE_USER,
  API_AUTH_STATUS,
  API_DELETE_USER,
  API_LOGIN,
  API_REGISTER,
  API_SET_ROLES,
  API_UNAPPROVE_USER,
  API_USER_ROLE,
  API_USERS_BASE,
} from '@/lib/consts/urls';
import { createErrorResponse } from '@/lib/account/errors';
import {
  fetchWithAuthHeader,
  fetchWithRenewIfNeeded,
  makeRefreshRequest,
} from '@/lib/account/requests';

const BASE_URL = process.env.USER_AUTH_BASE_URL;

export async function userAuthStatusAction(): Promise<
  MessageResponse | ErrorResponse
> {
  const response = await fetchWithAuthHeader({
    url: `${BASE_URL}${API_AUTH_STATUS}`,
    method: 'POST',
  });

  return await errorAsMessageOrErrorResponse(response);
}

export async function setUserRolesAction(): Promise<
  MessageResponse | ErrorResponse
> {
  const parsedResponse = await fetchWithRenewIfNeeded({
    url: `${BASE_URL}${API_SET_ROLES}`,
    method: 'GET',
  });

  const messageResponseParse = messageResponseSchema.safeParse(parsedResponse);
  if (messageResponseParse.success) {
    return messageResponseParse.data;
  }

  const errorResponseParse = errorResponseSchema.safeParse(parsedResponse);
  if (errorResponseParse.success) {
    return errorResponseParse.data;
  }

  return createErrorResponse();
}

export async function loginUserAction(payload: {
  username: string;
  password: string;
}): Promise<MessageResponse | ErrorResponse> {
  const response = await fetchWithAuthHeader({
    url: `${BASE_URL}${API_LOGIN}`,
    method: 'POST',
    data: payload,
  });
  return await errorAsMessageOrErrorResponse(response);
}

export async function renewTokensAction(): Promise<
  MessageResponse | ErrorResponse
> {
  const response = await makeRefreshRequest();
  return await errorAsMessageOrErrorResponse(response);
}

export async function registerUserAction(payload: {
  username: string;
  password: string;
}): Promise<MessageResponse | ErrorResponse> {
  const url = new URL(`${BASE_URL}${API_REGISTER}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return await errorAsMessageOrErrorResponse(response);
}

export async function userRoleAction(): Promise<RoleResponse | ErrorResponse> {
  const parsedResponse = await fetchWithRenewIfNeeded({
    url: `${BASE_URL}${API_USER_ROLE}`,
    method: 'GET',
  });

  const errorResponseParse = errorResponseSchema.safeParse(parsedResponse);
  if (errorResponseParse.success) {
    return errorResponseParse.data;
  }

  const roleResponseParse = roleResponseSchema.safeParse(parsedResponse);
  if (roleResponseParse.success) {
    return roleResponseParse.data;
  }

  return createErrorResponse();
}

export async function deleteUnapprovedUsersAction() {
  return await fetchWithRenewIfNeeded({
    url: `${BASE_URL}${API_DELETE_USER}`,
    method: 'POST',
  });
}

export async function approveUserAction(username: string) {
  return await fetchWithRenewIfNeeded({
    url: `${BASE_URL}${API_APPROVE_USER}`,
    method: 'POST',
    data: { username },
  });
}

export async function unapproveUserAction(username: string) {
  return await fetchWithRenewIfNeeded({
    url: `${BASE_URL}${API_UNAPPROVE_USER}`,
    method: 'POST',
    data: { username },
  });
}

async function errorAsMessageOrErrorResponse(
  response: Response
): Promise<MessageResponse | ErrorResponse> {
  const parsedResponse = await parsedServerResponse(response);
  const messageResponseParse = messageResponseSchema.safeParse(parsedResponse);
  if (messageResponseParse.success) {
    return messageResponseParse.data;
  }

  const errorResponseParse = errorResponseSchema.safeParse(parsedResponse);
  if (errorResponseParse.success) {
    return errorResponseParse.data;
  }

  return createErrorResponse(response);
}
