'use client';

import { fetchNewTokens, fetchUserStatus, requestLogin, requestRegistration } from '@/actions/auth';
import { useState } from 'react';
import { util } from 'zod';


import assertNever = util.assertNever;

export function useAuthRequest() {
  const [parsedToken, setParsedToken] = useState('');
  const [parsedRefreshToken, setParsedRefreshToken] = useState('');
  const [tokenResponse, setTokenResponse] = useState('');
  const [serverResponse, setServerResponse] = useState('');

  const loginUser = async (payload: { username: string; password: string }) => {
    const response = await requestLogin(payload);
    handleTokenResponse(response);
  };

  const checkUserAuthStatus = async () => {
    console.log('called handle status');
    if (!parsedToken) {
      setServerResponse('No token found');
      return;
    }

    const response = await fetchUserStatus({ token: parsedToken });
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
    console.log('called handle refresh');
    if (!parsedRefreshToken) {
      setServerResponse('No refresh token found');
      return;
    }

    const response = await fetchNewTokens({
      refreshToken: parsedRefreshToken,
    });
    handleTokenResponse(response);
  };

  const registerUser = async (payload: {
    username: string;
    password: string;
  }) => {
    const response = await requestRegistration(payload);
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

  const handleTokenResponse = (
    response: { type: 'success'; data: TokenResponse } | ErrorResponse
  ) => {
    switch (response.type) {
      case 'error':
        setServerResponse(stringifyErrors(response.errors) || 'Server error');
        break;
      case 'success':
        if (response.data) {
          setTokenResponse(JSON.stringify(response.data, null, 2));
          setParsedToken(response.data.token);
          setParsedRefreshToken(response.data.refreshToken);
          setServerResponse('token updated');
        } else {
          setServerResponse('No token found');
        }
        break;
      default:
        assertNever(response);
    }
  };

  return {
    loginUser,
    checkUserAuthStatus,
    renewTokens,
    registerUser,
    tokenResponse,
    serverResponse,
  };
}

function stringifyErrors(errors: ApiError[]) {
  return errors
    .map((error) => `${error.code}: ${error.description}`)
    .join(', ');
}
