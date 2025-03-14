import { userRoleAction } from '@/actions/account';
import 'server-only';
import { errorResponseSchema, roleResponseSchema } from '@/lib/types/account';
import { stringifyErrors } from '@/lib/account/errors';

export default async function AccountStatus() {
  const response = await userRoleAction();
  let content = 'Unknown server error';
  const errorResponseParse = errorResponseSchema.safeParse(response);
  if (errorResponseParse.success) {
    content = stringifyErrors(errorResponseParse.data.errors).join(', ');
  }

  const roleResponseParse = roleResponseSchema.safeParse(response);
  if (roleResponseParse.success) {
    const role = roleResponseParse.data.data.role;
    switch (role) {
      case 'Admin':
        content = 'You are an admin';
        break;
      case 'NewUser':
        content = 'You have registered. Please wait for approval';
        break;
      case 'AcceptedUser':
        content = 'You have been approved';
        break;
    }
  }

  return (
    <main className={'flex min-h-screen flex-col items-center gap-2'}>
      <h1 className={'pt-6 text-4xl font-bold'}>Account Status</h1>
      <p className={'text-lg'}>{content}</p>
    </main>
  );
}
