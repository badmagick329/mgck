'use client';

import {
  loginUserAction,
  registerUserAction,
  renewTokensAction,
  userAuthStatusAction,
} from '@/actions/auth';
import { stringifyErrors } from '@/lib/auth/utils';
import { ServerResponse } from '@/lib/types/auth';
import { useState } from 'react';
import { util } from 'zod';

import assertNever = util.assertNever;

export function useAuthRequest() {
  const [serverResponse, setServerResponse] = useState('');

  const loginUser = async (payload: { username: string; password: string }) => {
    const response = await loginUserAction(payload);
    handleTokenResponse(response);
  };

  const userAuthStatus = async () => {
    const response = await userAuthStatusAction();
    switch (response.type) {
      case 'error':
        setServerResponse(stringifyErrors(response.errors) || 'Server error');
        break;
      case 'success':
        setServerResponse(response.message || 'You are logged in');
        break;
      default:
        assertNever(response);
    }
  };

  const renewTokens = async () => {
    const response = await renewTokensAction();
    handleTokenResponse(response);
  };

  const registerUser = async (payload: {
    username: string;
    password: string;
  }) => {
    const response = await registerUserAction(payload);
    switch (response.type) {
      case 'error':
        setServerResponse(stringifyErrors(response.errors) || 'Server error');
        break;
      case 'success':
        setServerResponse(response.message || 'User registered');
        break;
      default:
        assertNever(response);
    }
  };

  const handleTokenResponse = (response: ServerResponse) => {
    switch (response.type) {
      case 'error':
        setServerResponse(stringifyErrors(response.errors) || 'Server error');
        break;
      case 'success':
        setServerResponse(response.message || 'Tokens renewed');
        break;
      default:
        assertNever(response);
    }
  };

  return {
    loginUser,
    userAuthStatus,
    renewTokens,
    registerUser,
    serverResponse,
  };
}
