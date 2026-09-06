import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getVerifiedCoreSession } from '@/lib/account/verified-session';
import { ADMIN_ROLE } from '@/lib/consts/account';
import { getAiMonitoring } from '@/lib/emojify/monitoring';
import { changeAiAvailability } from '@/actions/ai-monitoring';

export const dynamic = 'force-dynamic';

export default async function AiUsagePage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const session = await getVerifiedCoreSession();
  if (session?.role !== ADMIN_ROLE) notFound();
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const start =
    params.start ??
    new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const end = params.end ?? today;
  const validDate = (value: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;
  if (!validDate(start) || !validDate(end) || start > end) {
    return (
      <p className='p-6'>
        Invalid date range.{' '}
        <Link href='/account/home/ai-usage'>Reset dates</Link>
      </p>
    );
  }
  let monitoring;
  try {
    monitoring = await getAiMonitoring(start, end);
  } catch {
    return (
      <main className='mx-auto max-w-6xl space-y-4 p-6'>
        <Link href='/account/home'>Back to admin</Link>
        <h1 className='text-2xl font-semibold'>AI usage</h1>
        <p role='alert'>
          Monitoring is unavailable. New AI requests are blocked when the
          monitoring database cannot be reached. Check the database
          configuration and migration.
        </p>
      </main>
    );
  }
  return (
    <main className='mx-auto max-w-6xl space-y-6 p-6'>
      <Link href='/account/home' className='underline'>
        Back to admin
      </Link>
      <h1 className='text-2xl font-semibold'>Emojiify AI usage</h1>
      <section className='space-y-3 rounded-lg border p-4'>
        <h2 className='text-lg font-semibold'>
          AI is {monitoring.enabled ? 'enabled' : 'disabled'}
        </h2>
        <form action={changeAiAvailability}>
          <input
            type='hidden'
            name='enabled'
            value={monitoring.enabled ? 'false' : 'true'}
          />
          <button
            className={`rounded-md px-4 py-2 font-semibold ${monitoring.enabled ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}`}
          >
            {monitoring.enabled ? 'Disable AI immediately' : 'Enable AI'}
          </button>
        </form>
        <p className='text-sm text-muted-foreground'>
          Disabling blocks new AI calls across this app. Requests already
          admitted may finish. Random emojis remain available. A compromised API
          key must also be revoked with the provider.
        </p>
      </section>
      <form className='flex flex-wrap items-end gap-4'>
        <label className='grid gap-1'>
          From (UTC)
          <input
            className='rounded border bg-background p-2'
            type='date'
            name='start'
            defaultValue={start}
            required
          />
        </label>
        <label className='grid gap-1'>
          To (UTC)
          <input
            className='rounded border bg-background p-2'
            type='date'
            name='end'
            defaultValue={end}
            required
          />
        </label>
        <button className='rounded border px-4 py-2'>Refresh usage</button>
      </form>
      <p className='text-sm text-muted-foreground'>
        Requests count admitted provider attempts. Pending means still running
        or completion was not recorded. Tokens are provider-reported; — means
        unavailable. No message text is stored.
      </p>
      <div className='overflow-x-auto rounded-lg border'>
        <table className='w-full whitespace-nowrap text-left text-sm'>
          <caption className='p-3 text-left'>Daily usage by user</caption>
          <thead>
            <tr>
              {[
                'Day (UTC)',
                'User',
                'Requests',
                'Succeeded',
                'Failed',
                'Pending',
                'Characters',
                'Input tokens',
                'Output tokens',
                'Total tokens',
              ].map((label) => (
                <th key={label} className='p-3'>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monitoring.rows.map((row) => (
              <tr key={`${row.day}:${row.user_id}`} className='border-t'>
                <td className='p-3'>{row.day}</td>
                <td className='p-3'>
                  {row.username}
                  <span className='block text-xs text-muted-foreground'>
                    {row.user_id}
                  </span>
                </td>
                {[
                  row.requests,
                  row.succeeded,
                  row.failed,
                  row.pending,
                  row.characters,
                  row.prompt_tokens,
                  row.output_tokens,
                  row.total_tokens,
                ].map((value, index) => (
                  <td className='p-3' key={index}>
                    {value ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!monitoring.rows.length && (
          <p className='p-4 text-muted-foreground'>
            No AI requests in this date range.
          </p>
        )}
      </div>
    </main>
  );
}
