import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ReactNode } from 'react';

type Action = {
  href: string;
  label: string;
  external?: boolean;
};

type Props = {
  title: string;
  description: string;
  icon: ReactNode;
  className: string;
  buttonClassName: string;
  primary: Action;
  status?: string;
  secondary?: Action;
};

export default function HomeFeatureSection({
  title,
  description,
  icon,
  className,
  buttonClassName,
  primary,
  status,
  secondary,
}: Props) {
  return (
    <section className={`grid min-h-56 place-content-center place-items-center gap-5 border-t-2 px-6 py-10 text-center sm:min-h-64 ${className}`}>
      <div className='flex max-w-3xl flex-col items-center gap-3'>
        <div className='text-3xl'>{icon}</div>
        <h2 className='text-2xl font-bold md:text-3xl'>{title}</h2>
        <p className='text-base md:text-lg'>{description}</p>
        {status && <span className='rounded-full border border-current/30 bg-background/20 px-3 py-1 text-sm font-semibold'>{status}</span>}
      </div>
      <div className='flex flex-wrap justify-center gap-3'>
        <FeatureAction action={primary} className={buttonClassName} />
        {secondary && <FeatureAction action={secondary} className='border-current/40 bg-background/20 hover:bg-background/35' />}
      </div>
    </section>
  );
}

function FeatureAction({ action, className }: { action: Action; className: string }) {
  if (action.external) {
    return <Button asChild className={`min-w-64 font-semibold shadow-lg md:min-w-80 md:text-lg ${className}`}><a href={action.href}>{action.label}</a></Button>;
  }
  return <Button asChild className={`min-w-64 font-semibold shadow-lg md:min-w-80 md:text-lg ${className}`}><Link href={action.href}>{action.label}</Link></Button>;
}
