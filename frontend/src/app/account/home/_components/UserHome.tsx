import LogoutButton from './LogoutButton';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RotatingEmojis from './RotatingEmojis';

export interface UserHomeProps {
  username: string;
  isApproved: boolean;
  emojis: string[];
  features: { name: string; href: string; description?: string }[];
}

export default function UserHome({
  username,
  isApproved,
  emojis,
  features = [],
}: UserHomeProps) {
  return (
    <div className='w-full grow bg-background-kp'>
      <UserWelcomeHeader username={username} />
      <main className='flex flex-col gap-8 px-4 py-4'>
        <AccountStatus isApproved={isApproved} />
        <FeaturesShowcase
          isApproved={isApproved}
          features={features}
          emojis={emojis}
        />
      </main>
    </div>
  );
}

function UserWelcomeHeader({ username }: { username: string }) {
  return (
    <header className='bg-gradient-to-r from-blue-700 to-blue-900 py-8'>
      <div className='container mx-auto flex items-center justify-between px-4 text-gray-50'>
        <h1 className='text-3xl font-bold'>Welcome, {username}</h1>
        <LogoutButton />
      </div>
    </header>
  );
}

function AccountStatus({ isApproved }: { isApproved: boolean }) {
  return (
    <section>
      {isApproved ? (
        <span className='rounded-sm bg-success/60 px-4 py-2 font-semibold'>
          <span>Account Status: Active</span>
        </span>
      ) : (
        <div className='rounded-md border-l-4 border-yellow-500 bg-yellow-100 p-6 text-gray-950'>
          <h2 className='mb-2 text-2xl font-semibold'>Awaiting Approval</h2>
          <p className='text-lg'>
            You have registered. Please wait for approval. If your role was
            updated, you may need to login again for it to take effect.
          </p>
        </div>
      )}
    </section>
  );
}

function FeaturesShowcase({
  isApproved,
  features,
  emojis,
}: {
  isApproved: boolean;
  features: { name: string; href: string; description?: string }[];
  emojis: string[];
}) {
  if (!isApproved) {
    return null;
  }

  if (features.length < 1) {
    return (
      <section>
        <h2 className='mb-4 text-2xl font-bold'>Available Features</h2>
        <div className='grid-auto-fill-sm'>
          <p className='text-muted-foreground'>
            No features available at this time.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className='mb-4 text-2xl font-bold'>Available Features</h2>
      <div className='grid-auto-fill-sm'>
        {features.map((feature) => (
          <Link key={feature.href} href={feature.href}>
            <Card className='max-w-[400px] rounded-sm border-foreground/40 bg-primary-kp/20 hover:bg-primary-kp/40'>
              <CardHeader className='border-b-2 border-foreground/40'>
                <CardTitle>{feature.name}</CardTitle>
              </CardHeader>
              <CardContent className='grid grid-cols-1 gap-2 py-6 text-lg'>
                <span>
                  {feature.description} <RotatingEmojis emojis={emojis} />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
