'use client';

import { useAuthRequest } from '@/hooks/use-auth-request';
import { useState } from 'react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const {
    loginUser,
    userAuthStatus,
    renewTokens,
    registerUser,
    serverResponse,
  } = useAuthRequest();

  return (
    <main className={'flex min-h-screen flex-col'}>
      <div className={'flex justify-center py-2'}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loginUser({ username, password });
          }}
          className={'grid grid-cols-1 gap-4'}
        >
          <input
            type={'text'}
            autoComplete='off'
            name={'username'}
            value={username}
            onChange={(e) => setUsername(e.target.value || '')}
          />
          <input
            type={'password'}
            autoComplete='off'
            name={'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value || '')}
          />
          <div className={'flex justify-center gap-4'}>
            <button type={'submit'} className={'bg-blue-500 px-4 py-2'}>
              Login
            </button>
            <button
              type={'button'}
              className={'bg-cyan-600 px-4 py-2'}
              onClick={(e) => registerUser({ username, password })}
            >
              Register
            </button>
            <button
              type={'button'}
              className={'bg-green-800 px-4 py-2'}
              onClick={userAuthStatus}
            >
              Get status
            </button>
            <button
              type={'button'}
              className={'bg-yellow-500 px-4 py-2'}
              onClick={renewTokens}
            >
              Refresh
            </button>
          </div>
        </form>
      </div>
      <div className={'flex flex-col gap-4'}>
        <div className={'mx-auto'}>
          <textarea
            readOnly
            rows={10}
            cols={120}
            className={'select-none'}
            placeholder={'server response'}
            value={serverResponse}
          />
        </div>
      </div>
    </main>
  );
}
