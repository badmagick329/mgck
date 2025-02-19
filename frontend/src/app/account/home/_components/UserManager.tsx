'use client';

import {
  ACCEPTED_USER_ROLE,
  NEW_USER_ROLE,
  UsersResponseData,
} from '@/lib/types/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
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
    <div className={'flex flex-col items-center gap-4'}>
      <DeleteButton />
      <ul className={'flex flex-wrap justify-center gap-4 md:px-4 lg:px-8'}>
        {users.map(({ username, role }) => (
          <Card
            key={`${username}-${role}`}
            className={
              'border-white border-2 rounded-md p-2 bg-slate-800 w-[14rem] flex flex-col gap-2 items-center'
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
    </div>
  );
}

function ApproveButton({ role, username }: { role: string; username: string }) {
  const router = useRouter();
  if (role === NEW_USER_ROLE) {
    return (
      <Button
        variant={'outline'}
        className={' border-green-600 border-2'}
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
        className={'border-yellow-500 border-2'}
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
      <AlertDialogTrigger>
        <Button variant={'outline'} className={'border-red-700 border-2'}>
          Delete All Unapproved Users
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={
              'destructive bg-red-700/80 border-red-700 border-2 hover:bg-red-700'
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
