import { redirect } from 'next/navigation';

export default async function AuthRedirect() {
  redirect('/account/login');
}
