import Link from 'next/link';
import { ReactNode } from 'react';

export type LauncherApp = {
  href: string;
  name: string;
  description: string;
  icon: ReactNode;
  className: string;
  external?: boolean;
};

export default function AppLauncher({ apps }: { apps: LauncherApp[] }) {
  return (
    <section aria-label='Apps' className='grid w-full max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {apps.map((app) => (
        <Link
          key={app.href}
          href={app.href}
          target={app.external ? '_blank' : undefined}
          className={`group rounded-xl border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${app.className}`}
        >
          <div className='mb-4 text-3xl'>{app.icon}</div>
          <h2 className='text-xl font-bold'>{app.name}</h2>
          <p className='mt-2 text-sm text-foreground/75'>{app.description}</p>
        </Link>
      ))}
    </section>
  );
}
