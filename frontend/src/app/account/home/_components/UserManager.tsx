'use client';

import { UsersResponseData } from '@/lib/types/account';
import { ACCEPTED_USER_ROLE, NEW_USER_ROLE } from '@/lib/consts/account';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  approveUserAction,
  deleteUnapprovedUsersAction,
  unapproveUserAction,
} from '@/actions/account';
import { useRouter } from 'next/navigation';

export default function UserManager({ users }: { users: UsersResponseData }) {
  return (
    <main className='flex flex-col items-center gap-4 pt-8'>
      <DeleteButton />
      <ul className={'flex flex-wrap justify-center gap-4 md:px-4 lg:px-8'}>
        {users.map(({ username, role }) => (
          <Card
            key={`${username}-${role}`}
            className={
              'flex w-[14rem] flex-col items-center gap-2 rounded-md border-2 border-white bg-slate-800 p-2'
            }
          >
            <CardHeader>
              <span className={'text-lg'}>{username}</span>
              <span className={'text-sm text-gray-400'}>{role}</span>
            </CardHeader>
            <CardContent>
              <ApproveButton role={role} username={username} />
            </CardContent>
          </Card>
        ))}
      </ul>
    </main>
  );
}

function ApproveButton({ role, username }: { role: string; username: string }) {
  const router = useRouter();
  if (role === NEW_USER_ROLE) {
    return (
      <Button
        variant={'outline'}
        className={'border-2 border-green-600'}
        onClick={async () => {
          await approveUserAction(username);
          router.refresh();
        }}
      >
        Approve
      </Button>
    );
  } else if (role === ACCEPTED_USER_ROLE) {
    return (
      <Button
        variant={'outline'}
        className={'border-2 border-yellow-500'}
        onClick={async () => {
          await unapproveUserAction(username);
          router.refresh();
        }}
      >
        Unapprove
      </Button>
    );
  }
  return null;
}

function DeleteButton() {
  const router = useRouter();
  return (
    <AlertDialog>
      <AlertDialogTrigger className='focus:outline-none focus:ring-0 focus:ring-offset-0'>
        <span className='rounded-md border-2 border-red-700/60 px-4 py-2 hover:border-red-700'>
          Delete All Unapproved Users
        </span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogDescription>
          Delete all unapproved users
        </AlertDialogDescription>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={
              'destructive border-2 border-red-700 bg-red-700/80 hover:bg-red-700'
            }
            onClick={async () => {
              await deleteUnapprovedUsersAction();
              router.refresh();
            }}
          >
            Yes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
