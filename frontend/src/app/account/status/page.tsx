import { userRoleAction } from '@/actions/account';
import 'server-only';
import { errorResponseSchema, roleResponseSchema } from '@/lib/types/auth';
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
    <main className={'flex flex-col min-h-screen items-center gap-2'}>
      <h1 className={'text-4xl font-bold pt-6'}>Account Status</h1>
      <p className={'text-lg'}>{content}</p>
    </main>
  );
}
