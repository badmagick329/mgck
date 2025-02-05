'use server';

import { API_AUTH_STATUS, API_LOGIN_USER } from '@/lib/consts/urls';

const BASE_URL = process.env.USER_AUTH_BASE_URL;

export async function fetchUserStatus({
  token,
}: {
  token: string;
}): Promise<ServerResponse> {
  const url = new URL(`${BASE_URL}${API_AUTH_STATUS}`);
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  console.log(`Result is ${response}. code: ${response.status}`);
  if (response.status === 200) {
    return { success: true };
  }

  return { success: false, message: `${response.status}` };
}

export async function loginUser(payload: {
  username: string;
  password: string;
}): Promise<LoginResponse> {
  const url = new URL(`${BASE_URL}${API_LOGIN_USER}`);
  console.log(`Sending to ${url.toString()}`, payload);
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  console.log('fetch done. checking for 200');

  if (response.status !== 200) {
    console.log(`status is ${response.status}`);
    return {
      success: false,
      message: `status is ${response.status}`,
    };
  }

  try {
    const data = await response.json();
    console.log('parsed 200 json');
    if (!data.token || !data.refreshToken) {
      return {
        success: false,
        message: `No token or refresh token in response: ${JSON.stringify(data)}`,
      };
    }
    const result = {
      success: true,
      data: {
        token: data.token,
        refreshToken: data.refreshToken,
      },
    };
    console.log('returning...');
    console.log(result);

    return result;
  } catch {
    return {
      success: false,
    };
  }
}
