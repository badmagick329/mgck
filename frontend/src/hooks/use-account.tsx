'use client';

import {
  loginUserAction,
  registerUserAction,
  renewTokensAction,
  setUserRolesAction,
  userAuthStatusAction,
  userRoleAction,
} from '@/actions/account';
import { stringifyErrors } from '@/lib/account/errors';
import { AspAuthResponse, SuccessResponse } from '@/lib/types/auth';
import { useState } from 'react';
import { util } from 'zod';
import { isMessageResponse, isRoleResponse } from '@/lib/account/predicates';
import assertNever = util.assertNever;

export function useAccount() {
  const [errorResponse, setErrorResponse] = useState<string[]>([]);
  const [serverResponse, setServerResponse] = useState('');

  const loginUser = async (payload: { username: string; password: string }) => {
    const response = await loginUserAction(payload);
    handleResponse(response);
  };

  const userAuthStatus = async () => {
    const response = await userAuthStatusAction();
    handleResponse(response);
  };

  const renewTokens = async () => {
    const response = await renewTokensAction();
    handleResponse(response);
  };

  const userRole = async () => {
    const response = await userRoleAction();
    handleResponse(response);
  };

  const setRoles = async () => {
    const response = await setUserRolesAction();
    handleResponse(response);
  };

  const registerUser = async (payload: {
    username: string;
    password: string;
  }) => {
    const response = await registerUserAction(payload);
    handleResponse(response);
  };

  const handleResponse = (response: AspAuthResponse) => {
    switch (response.type) {
      case 'error':
        setServerResponse('');
        setErrorResponse(stringifyErrors(response.errors) || ['Server error']);
        break;
      case 'success':
        setServerResponse(messageFromData(response));
        setErrorResponse([]);
        break;
      default:
        assertNever(response);
    }
  };

  return {
    loginUser,
    userAuthStatus,
    renewTokens,
    userRole,
    setRoles,
    registerUser,
    errorResponse,
    setErrorResponse,
    serverResponse,
  };
}

const messageFromData = (response: SuccessResponse) => {
  return (
    (isMessageResponse(response) && response.data.message) ||
    (isRoleResponse(response) && response.data.role) ||
    'success'
  );
};
