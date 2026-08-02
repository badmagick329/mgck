'use client';

import { createFeedbackAction } from '@/actions/feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { feedbackCreationSuccessSchema } from '@/lib/types/feedback';
import { getFilesUrl } from '@/lib/files/url';
import Link from 'next/link';
import { FormEvent, useState } from 'react';

export default function FilesAccessRequestForm({
  defaultUsername,
}: {
  defaultUsername: string;
}) {
  const [username, setUsername] = useState(defaultUsername);
  const [contact, setContact] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !contact.trim()) {
      setError('Enter your main-site username and a preferred contact method.');
      return;
    }
    setSubmitting(true);
    setError('');
    const result = await createFeedbackAction({
      createdBy: username.trim(),
      originPath: '/files/request-access',
      comment: `Files access request\nCore username: ${username.trim()}\nContact: ${contact.trim()}${note.trim() ? `\nNote: ${note.trim()}` : ''}`,
    });
    setSubmitting(false);
    if (feedbackCreationSuccessSchema.safeParse(result).success) {
      setSubmitted(true);
    } else {
      setError('Your request could not be submitted. Please try again later.');
    }
  }

  return (
    <section className='w-full max-w-xl rounded-xl border border-slate-500 bg-slate-800 p-6 shadow-xl'>
      <h1 className='text-3xl font-bold'>Request Files access</h1>
      <p className='mt-3 text-slate-300'>Files uses a separately managed account. Main-site registration and approval do not automatically grant Files access.</p>
      {submitted ? (
        <div className='mt-6 rounded-md border border-emerald-400/50 bg-emerald-950/40 p-4'>
          <p className='font-semibold'>Request submitted.</p>
          <p className='mt-1 text-sm text-slate-300'>If access is granted, you will receive separate Files credentials through your preferred contact method.</p>
          <Button asChild className='mt-4'><Link href='/'>Return home</Link></Button>
        </div>
      ) : (
        <form className='mt-6 grid gap-4' onSubmit={submit}>
          <div className='grid gap-2'>
            <Label htmlFor='core-username'>Main-site username</Label>
            <Input id='core-username' value={username} onChange={(event) => setUsername(event.target.value)} required />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='contact'>Preferred contact method</Label>
            <Input id='contact' placeholder='Discord handle or email address' value={contact} onChange={(event) => setContact(event.target.value)} required />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='note'>Note (optional)</Label>
            <Textarea id='note' rows={4} placeholder='Anything that will help with your request.' value={note} onChange={(event) => setNote(event.target.value)} />
          </div>
          {error && <p role='alert' className='text-sm text-red-300'>{error}</p>}
          <div className='flex flex-wrap gap-3'>
            <Button type='submit' disabled={submitting}>{submitting ? 'Submitting…' : 'Request access'}</Button>
            <Button asChild type='button' variant='outline'><a href={getFilesUrl()}>I already have a Files account</a></Button>
          </div>
        </form>
      )}
    </section>
  );
}
