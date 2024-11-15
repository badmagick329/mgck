'use server';

const BASE_URL = process.env.USER_AUTH_BASE_URL;

export async function testEndpoint() {
  console.log(`BASE_URL is ${BASE_URL}`);
  const result = await fetch(`${BASE_URL}/weatherforecast`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  console.log(`Result is ${result}. code: ${result.status}`);
  try {
    const json = await result.json();
    return json;
  } catch (error) {
    console.error(error);
  }
}
