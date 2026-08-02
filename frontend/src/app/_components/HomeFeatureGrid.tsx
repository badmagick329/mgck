import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ReactNode } from 'react';

type Action = {
  href: string;
  label: string;
  external?: boolean;
};

export type HomeFeature = {
  title: string;
  description: string;
  icon: ReactNode;
  className: string;
  buttonClassName: string;
  primary: Action;
  status?: string;
  secondary?: Action;
};

export default function HomeFeatureGrid({
  features,
}: {
  features: HomeFeature[];
}) {
  return (
    <section
      aria-label='Apps'
      className='mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 px-5 pb-12 sm:grid-cols-2 lg:grid-cols-3'
    >
      {features.map((feature) => (
        <article
          key={feature.title}
          className={`flex min-h-72 flex-col rounded-2xl border-2 p-6 shadow-xl transition duration-200 hover:-translate-y-1 hover:shadow-2xl ${feature.className}`}
        >
          <div className='mb-5 text-4xl'>{feature.icon}</div>
          <h2 className='text-2xl font-bold'>{feature.title}</h2>
          <p className='text-current/80 mt-3 text-base'>
            {feature.description}
          </p>
          {feature.status && (
            <span className='border-current/35 mt-4 w-fit rounded-full border bg-black/15 px-3 py-1 text-sm font-semibold'>
              {feature.status}
            </span>
          )}
          <div className='mt-auto flex flex-col gap-3 pt-6'>
            <FeatureAction
              action={feature.primary}
              className={feature.buttonClassName}
            />
            {feature.secondary && (
              <FeatureAction
                action={feature.secondary}
                className='border-current/40 bg-slate-800 text-white shadow-[0_0_10px_rgba(30,41,59,0.7)] hover:bg-slate-700'
              />
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

function FeatureAction({
  action,
  className,
}: {
  action: Action;
  className: string;
}) {
  if (action.external) {
    return (
      <Button asChild className={`w-full font-semibold ${className}`}>
        <a href={action.href}>{action.label}</a>
      </Button>
    );
  }
  return (
    <Button asChild className={`w-full font-semibold ${className}`}>
      <Link href={action.href}>{action.label}</Link>
    </Button>
  );
}
