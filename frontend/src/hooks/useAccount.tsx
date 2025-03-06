'use client';

import {
  loginUserAction,
  registerUserAction,
  userAuthStatusAction,
  userRoleAction,
} from '@/actions/account';
import { stringifyErrors } from '@/lib/account/errors';
import {
  AspAuthResponse,
  messageResponseSchema,
  roleResponseSchema,
  SuccessResponse,
} from '@/lib/types/auth';
import { useState } from 'react';
import { util } from 'zod';
import assertNever = util.assertNever;

export function useAccount() {
  const [errorResponse, setErrorResponse] = useState<string[]>([]);
  const [serverResponse, setServerResponse] = useState('');

  const loginUser = async (payload: { username: string; password: string }) => {
    const response = await loginUserAction(payload);
    return handleResponseAndReturnSuccess(response);
  };

  const userAuthStatus = async () => {
    const response = await userAuthStatusAction();
    return handleResponseAndReturnSuccess(response);
  };

  const userIsLoggedIn = async () => {
    const response = await userAuthStatusAction();
    const parsed = messageResponseSchema.safeParse(response);
    return parsed.success;
  };

  const userRole = async () => {
    const response = await userRoleAction();
    return handleResponseAndReturnSuccess(response);
  };

  const registerUser = async (payload: {
    username: string;
    password: string;
  }) => {
    const response = await registerUserAction(payload);
    return handleResponseAndReturnSuccess(response);
  };

  const handleResponseAndReturnSuccess = (response: AspAuthResponse) => {
    switch (response.type) {
      case 'error':
        setServerResponse('');
        setErrorResponse(stringifyErrors(response.errors) || ['Server error']);
        return false;
      case 'success':
        setServerResponse(messageFromData(response));
        setErrorResponse([]);
        return true;
      default:
        assertNever(response);
    }
  };

  return {
    loginUser,
    userIsLoggedIn,
    userAuthStatus,
    userRole,
    registerUser,
    errorResponse,
    setErrorResponse,
    serverResponse,
  };
}

const messageFromData = (response: SuccessResponse) => {
  const messageResponseParse = messageResponseSchema.safeParse(response);
  if (messageResponseParse.success) {
    return messageResponseParse.data.data.message;
  }

  const roleResponseParse = roleResponseSchema.safeParse(response);
  if (roleResponseParse.success) {
    return roleResponseParse.data.data.role;
  }

  return 'success';
};
