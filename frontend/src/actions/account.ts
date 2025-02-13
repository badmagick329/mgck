'use server';

import {
  isErrorResponse,
  isMessageResponse,
  isRoleResponse,
} from '@/lib/account/predicates';
import { parsedServerResponse } from '@/lib/account/parsed-server-response';
import {
  API_AUTH_STATUS,
  API_LOGIN,
  API_REGISTER,
  API_SET_ROLES,
  API_USER_ROLE,
} from '@/lib/consts/urls';
import { ErrorResponse, MessageResponse, RoleResponse } from '@/lib/types/auth';
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

  const parsedResponse = await parsedServerResponse(response);
  if (isMessageResponse(parsedResponse) || isErrorResponse(parsedResponse)) {
    return parsedResponse;
  }

  return createErrorResponse(response);
}

export async function userRoleAction(): Promise<RoleResponse | ErrorResponse> {
  const parsedResponse = await fetchWithRenewIfNeeded({
    url: `${BASE_URL}${API_USER_ROLE}`,
    method: 'GET',
  });

  if (isRoleResponse(parsedResponse) || isErrorResponse(parsedResponse)) {
    return parsedResponse;
  }

  return createErrorResponse();
}

export async function setUserRolesAction(): Promise<
  MessageResponse | ErrorResponse
> {
  const parsedResponse = await fetchWithRenewIfNeeded({
    url: `${BASE_URL}${API_SET_ROLES}`,
    method: 'GET',
  });

  if (isMessageResponse(parsedResponse) || isErrorResponse(parsedResponse)) {
    return parsedResponse;
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
  const parsedResponse = await parsedServerResponse(response);
  if (isMessageResponse(parsedResponse) || isErrorResponse(parsedResponse)) {
    return parsedResponse;
  }

  return createErrorResponse(response);
}

export async function renewTokensAction(): Promise<
  MessageResponse | ErrorResponse
> {
  const response = await makeRefreshRequest();

  const parsedResponse = await parsedServerResponse(response);
  if (isMessageResponse(parsedResponse) || isErrorResponse(parsedResponse)) {
    return parsedResponse;
  }

  return createErrorResponse(response);
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

  const parsedResponse = await parsedServerResponse(response);
  if (isMessageResponse(parsedResponse) || isErrorResponse(parsedResponse)) {
    return parsedResponse;
  }

  return createErrorResponse(response);
}
