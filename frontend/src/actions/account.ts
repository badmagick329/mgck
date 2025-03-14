'use server';

import {
  AspAuthResponse,
  ErrorResponse,
  errorResponseSchema,
  MessageResponse,
  messageResponseSchema,
  RoleResponse,
  roleResponseSchema,
} from '@/lib/types/account';
import { parsedServerResponse } from '@/lib/account/parsed-server-response';
import {
  API_APPROVE_USER,
  API_AUTH_STATUS,
  API_DELETE_USER,
  API_LOGIN,
  API_LOGOUT,
  API_REGISTER,
  API_UNAPPROVE_USER,
  API_USER_ROLE,
} from '@/lib/consts/urls';
import { createErrorResponse } from '@/lib/account/errors';
import { fetchWithAuthHeader } from '@/lib/account/requests';
import { cookies } from 'next/headers';

const BASE_URL = process.env.USER_AUTH_BASE_URL;

export async function userAuthStatusAction(): Promise<
  MessageResponse | ErrorResponse
> {
  const aspAuthResponse = await fetchWithAuthHeader({
    url: `${BASE_URL}${API_AUTH_STATUS}`,
    method: 'POST',
  });

  return await asMessageOrErrorResponse(aspAuthResponse);
}

export async function loginUserAction(payload: {
  username: string;
  password: string;
}): Promise<MessageResponse | ErrorResponse> {
  const response = await fetch(`${BASE_URL}${API_LOGIN}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return await asMessageOrErrorResponse(response);
}

export async function logoutUserAction() {
  const cookieStore = cookies();
  if (!cookieStore.get('token') && !cookieStore.get('refreshToken')) {
    return;
  }

  const response = await fetchWithAuthHeader({
    url: `${BASE_URL}${API_LOGOUT}`,
    method: 'POST',
  });

  cookieStore.delete('token');
  cookieStore.delete('refreshToken');

  return await asMessageOrErrorResponse(response);
}

export async function registerUserAction(payload: {
  username: string;
  password: string;
}): Promise<MessageResponse | ErrorResponse> {
  const response = await fetch(`${BASE_URL}${API_REGISTER}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return await asMessageOrErrorResponse(response);
}

export async function userRoleAction(): Promise<RoleResponse | ErrorResponse> {
  const response = await fetchWithAuthHeader({
    url: `${BASE_URL}${API_USER_ROLE}`,
    method: 'GET',
  });

  const errorResponseParse = errorResponseSchema.safeParse(response);
  if (errorResponseParse.success) {
    return errorResponseParse.data;
  }

  const roleResponseParse = roleResponseSchema.safeParse(response);
  if (roleResponseParse.success) {
    return roleResponseParse.data;
  }

  return createErrorResponse();
}

export async function deleteUnapprovedUsersAction() {
  return await fetchWithAuthHeader({
    url: `${BASE_URL}${API_DELETE_USER}`,
    method: 'POST',
  });
}

export async function approveUserAction(username: string) {
  return fetchWithAuthHeader({
    url: `${BASE_URL}${API_APPROVE_USER}`,
    method: 'POST',
    data: { username },
  });
}

export async function unapproveUserAction(username: string) {
  return fetchWithAuthHeader({
    url: `${BASE_URL}${API_UNAPPROVE_USER}`,
    method: 'POST',
    data: { username },
  });
}

async function asMessageOrErrorResponse(
  response: Response | AspAuthResponse
): Promise<MessageResponse | ErrorResponse> {
  if (response instanceof Response) {
    return await responseAsMessageOrErrorResponse(response);
  }

  return parsedResponseAsMessageOrErrorResponse(response);
}

async function responseAsMessageOrErrorResponse(
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

function parsedResponseAsMessageOrErrorResponse(
  response: AspAuthResponse
): MessageResponse | ErrorResponse {
  const messageResponseParse = messageResponseSchema.safeParse(response);
  if (messageResponseParse.success) {
    return messageResponseParse.data;
  }

  const errorResponseParse = errorResponseSchema.safeParse(response);
  if (errorResponseParse.success) {
    return errorResponseParse.data;
  }

  return {
    type: 'error',
    status: 500,
    errors: [{ code: '500', description: 'Unexpected server response' }],
  };
}
