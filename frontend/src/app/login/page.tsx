'use client';

import { testEndpoint } from '@/actions/login';
import { useEffect, useState } from 'react';

export default function Login() {
  const [data, setData] = useState(null);

  useEffect(() => {
    testEndpoint().then((res) => setData(res));
  }, []);

  return (
    <div>
      <h1>Login</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
