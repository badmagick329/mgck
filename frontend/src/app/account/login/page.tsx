'use client';
import { useState } from 'react';
import { useAccount } from '@/hooks/use-account';
import { useRouter } from 'next/navigation';
import { ACCOUNT_USER_HOME } from '@/lib/consts/urls';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();

  const { loginUser, registerUser, errorResponse, setErrorResponse } =
    useAccount();

  const handleSubmission = async () => {
    if (isRegistering && password !== password2) {
      setErrorResponse(['Passwords do not match']);
      return;
    }
    if (isRegistering && password === password2) {
      const registered = await registerUser({ username, password });
      if (!registered) {
        return;
      }
      const loggedIn = await loginUser({ username, password });
      loggedIn && router.push(ACCOUNT_USER_HOME);
      return;
    }

    const loggedIn = await loginUser({ username, password });
    loggedIn && router.push(ACCOUNT_USER_HOME);
  };

  return (
    <main className={'flex min-h-screen flex-col items-center'}>
      <div className={'flex justify-center py-6 bg-slate-800 h-[14rem] w-full'}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmission();
          }}
          className={'flex flex-col gap-4 max-w-[16rem] w-full'}
        >
          <input
            type={'text'}
            autoComplete='off'
            name={'username'}
            placeholder={'Enter username'}
            value={username}
            onChange={(e) => setUsername(e.target.value || '')}
          />
          <input
            type={'password'}
            autoComplete='off'
            name={'password'}
            placeholder={'Enter password'}
            value={password}
            onChange={(e) => setPassword(e.target.value || '')}
          />
          {isRegistering ? (
            <input
              type={'password'}
              autoComplete='off'
              name={'password2'}
              placeholder={'Confirm Password'}
              value={password2}
              onChange={(e) => setPassword2(e.target.value || '')}
            />
          ) : (
            <div className={'h-6 '}></div>
          )}

          <div className={'flex justify-center gap-4'}>
            <button type={'submit'} className={'bg-blue-500 px-4 py-2'}>
              {isRegistering ? 'Register' : 'Login'}
            </button>
            <button
              type={'button'}
              className={'bg-green-500 px-4 py-2'}
              onClick={() => {
                setPassword('');
                setPassword2('');
                setIsRegistering(!isRegistering);
              }}
            >
              {isRegistering ? 'Back' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
      <ErrorMessages errorResponse={errorResponse} />
    </main>
  );
}

function ErrorMessages({ errorResponse }: { errorResponse: string[] }) {
  if (errorResponse.length === 0) {
    return null;
  }
  return (
    <ul>
      {errorResponse.map((err) => (
        <li key={err} className={'text-red-400'}>
          {err}
        </li>
      ))}
    </ul>
  );
}

function ServerMessages({ serverResponse }: { serverResponse: string }) {
  if (!serverResponse) {
    return null;
  }

  return (
    <div className={'mx-auto'}>
      <p className={'text-green-400'}>{serverResponse}</p>
    </div>
  );
}
