import LogoutButton from './LogoutButton';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RotatingEmojis from './RotatingEmojis';

export interface UserHomeProps {
  username: string;
  status: 'pending' | 'approved';
  emojis: string[];
  features?: { name: string; href: string; description?: string }[];
}

export default function UserHome({
  username,
  status,
  emojis,
  features = [],
}: UserHomeProps) {
  return (
    <div className='grow w-full bg-background-kp'>
      <header className='bg-gradient-to-r from-blue-700 to-blue-900 py-8'>
        <div className='container mx-auto px-4 flex justify-between items-center text-gray-50'>
          <h1 className='text-3xl font-bold'>Welcome, {username}</h1>
          <LogoutButton />
        </div>
      </header>

      <main className='container mx-auto px-4 py-8'>
        <section className='mb-8 text-gray-950'>
          <div
            className={`p-6 rounded-lg shadow-md border-l-4 ${
              status === 'pending'
                ? 'bg-yellow-100 border-yellow-500'
                : 'bg-green-100 border-green-500'
            }`}
          >
            <h2 className='text-2xl font-semibold mb-2'>
              {status === 'pending' ? 'Awaiting Approval' : 'Approved'}
            </h2>
            <p className='text-lg'>
              {status === 'pending'
                ? 'You have registered. Please wait for approval. If your role was updated, try logging in again to update it.'
                : 'Your account is active.'}
            </p>
          </div>
        </section>

        {status === 'approved' && (
          <section>
            <h2 className='text-2xl font-bold mb-4'>Available Features</h2>
            <div className='grid-auto-fill'>
              {features.length > 0 ? (
                features.map((feature) => (
                  <Link key={feature.href} href={feature.href}>
                    <Card className='border-foreground/40 bg-primary-kp/20 hover:bg-primary-kp/40 max-w-[400px]'>
                      <CardHeader className='border-b-2 border-foreground/40'>
                        <CardTitle>{feature.name}</CardTitle>
                      </CardHeader>
                      <CardContent className='grid grid-cols-1 gap-2 text-lg py-6'>
                        <span>
                          {feature.description}{' '}
                          <RotatingEmojis emojis={emojis} />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              ) : (
                <p className='text-muted-foreground'>
                  No features available at this time.
                </p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
