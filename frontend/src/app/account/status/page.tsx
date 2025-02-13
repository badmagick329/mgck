import { userRoleAction } from '@/actions/account';
import 'server-only';
import { isErrorResponse, isRoleResponse } from '@/lib/account/predicates';
import { stringifyErrors } from '@/lib/account/errors';
import { UserRole } from '@/lib/types/auth';

export default async function AccountStatus() {
  const response = await userRoleAction();
  let content = 'Unknown server error';
  if (isErrorResponse(response)) {
    content = stringifyErrors(response.errors).join(', ');
  }

  if (isRoleResponse(response)) {
    const role = response.data.role as UserRole;
    console.log(`role is ${role}`);
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
