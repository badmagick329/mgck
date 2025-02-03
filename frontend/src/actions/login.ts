'use server';

const BASE_URL = process.env.USER_AUTH_BASE_URL;

export async function testEndpoint() {
  const url = new URL(`${BASE_URL}/weatherforecast`);
  const result = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  console.log(`Result is ${result}. code: ${result.status}`);
  try {
    return await result.json();
  } catch (error) {
    console.error(error);
  }
}
