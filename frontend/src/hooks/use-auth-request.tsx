'use client';

import { fetchUserStatus, loginUser } from '@/actions/auth';
import { useState } from 'react';

export function useAuthRequest() {
  const [parsedToken, setParsedToken] = useState('');
  const [parsedRefreshToken, setParsedRefreshToken] = useState('');
  const [tokenResponse, setTokenResponse] = useState('');
  const [serverResponse, setServerResponse] = useState('');

  const handleLogin = async (payload: {
    username: string;
    password: string;
  }) => {
    console.log('handle login called');
    const response = await loginUser(payload);
    if (response.success) {
      if (response.data) {
        setTokenResponse(JSON.stringify(response.data, null, 2));
        setParsedToken(response.data.token);
        setParsedRefreshToken(response.data.refreshToken);
      }
      setServerResponse('token updated');
      return;
    }

    setServerResponse(response?.message || 'No message');
  };

  const handleStatus = async () => {
    console.log('called handle status');
    if (!parsedToken) {
      setServerResponse('No token found');
      return;
    }

    const response = await fetchUserStatus({ token: parsedToken });
    if (!response.success) {
      setServerResponse(response.message || 'Server error');
      return;
    }

    setServerResponse('You are logged in');
  };

  return {
    handleLogin,
    handleStatus,
    tokenResponse,
    serverResponse,
  };
}
