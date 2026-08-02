'use client';

import {
  approveUserAction,
  deleteUnapprovedUsersAction,
  unapproveUserAction,
} from '@/actions/account';
import { Button } from '@/components/ui/button';
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
import { ACCEPTED_USER_ROLE, NEW_USER_ROLE } from '@/lib/consts/account';
import { UsersResponseData } from '@/lib/types/account';
import { ShieldCheck, UserRoundCheck, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UserManager({ users }: { users: UsersResponseData }) {
  const pendingUsers = users.filter(({ role }) => role === NEW_USER_ROLE);
  const acceptedUsers = users.filter(({ role }) => role === ACCEPTED_USER_ROLE);

  return (
    <section
      aria-labelledby='user-access-heading'
      className='rounded-2xl border border-border bg-card p-5 shadow-sm'
    >
      <div className='mb-5 flex items-start justify-between gap-4'>
        <div>
          <div className='mb-2 flex items-center gap-2 text-muted-foreground'>
            <Users className='h-4 w-4' />
            <span className='text-sm font-medium'>User access</span>
          </div>
          <h2 id='user-access-heading' className='text-xl font-semibold'>
            Manage accounts
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            Approve new registrations or change an existing user’s access.
          </p>
        </div>
        <span className='whitespace-nowrap rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground'>
          {pendingUsers.length} awaiting approval
        </span>
      </div>

      <div className='grid gap-3'>
        {users.map(({ username, role }) => (
          <UserRow
            key={`${username}-${role}`}
            role={role}
            username={username}
          />
        ))}
      </div>

      {users.length === 0 && (
        <p className='rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground'>
          No Core accounts found.
        </p>
      )}

      <div className='mt-5 flex items-center gap-2 text-sm text-muted-foreground'>
        <UserRoundCheck className='h-4 w-4' />
        {acceptedUsers.length} approved user
        {acceptedUsers.length === 1 ? '' : 's'}
      </div>

      {pendingUsers.length > 0 && <DeleteUnapprovedUsers />}
    </section>
  );
}

function UserRow({ role, username }: { role: string; username: string }) {
  return (
    <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3'>
      <div>
        <p className='font-medium'>{username}</p>
        <p className='text-sm text-muted-foreground'>{role}</p>
      </div>
      <ApproveButton role={role} username={username} />
    </div>
  );
}

function ApproveButton({ role, username }: { role: string; username: string }) {
  const router = useRouter();
  if (role === NEW_USER_ROLE) {
    return (
      <Button
        size='sm'
        className='bg-emerald-700 text-white hover:bg-emerald-600'
        onClick={async () => {
          await approveUserAction(username);
          router.refresh();
        }}
      >
        Approve
      </Button>
    );
  }
  if (role === ACCEPTED_USER_ROLE) {
    return (
      <Button
        size='sm'
        variant='outline'
        className='border-transparent text-muted-foreground hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300'
        onClick={async () => {
          await unapproveUserAction(username);
          router.refresh();
        }}
      >
        Unapprove
      </Button>
    );
  }
  return (
    <span className='text-sm font-medium text-muted-foreground'>Admin</span>
  );
}

function DeleteUnapprovedUsers() {
  const router = useRouter();
  return (
    <div className='mt-6 border-t border-border pt-4'>
      <p className='text-sm font-medium'>Danger zone</p>
      <p className='mt-1 text-sm text-muted-foreground'>
        Permanently remove every account still awaiting approval.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className='mt-3' variant='outline'>
            Delete pending accounts
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all pending accounts?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes every account that has not been approved.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={async () => {
                await deleteUnapprovedUsersAction();
                router.refresh();
              }}
            >
              Delete pending accounts
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
