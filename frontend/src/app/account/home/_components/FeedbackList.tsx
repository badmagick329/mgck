'use client';

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
import { Button } from '@/components/ui/button';
import { useFeedback } from '@/hooks/useFeedback';
import {
  Feedback,
  feedbackErrorSchema,
  feedbacksSuccessSchema,
} from '@/lib/types/feedback';
import { MessageSquareText } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function FeedbackList() {
  const { getFeedback, deleteFeedback } = useFeedback();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [error, setError] = useState('');
  const [selectedFeedbacks, setSelectedFeedbacks] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      const response = await getFeedback();
      const parsed = feedbacksSuccessSchema.safeParse(response);
      if (parsed.success) {
        setError('');
        setFeedbacks(parsed.data.data.feedbacks);
      } else {
        setError('Failed to fetch feedback.');
      }
    };
    fetchFeedbacks();
  }, [getFeedback]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const results = await Promise.allSettled(
        selectedFeedbacks.map(async (feedbackId) => {
          const result = await deleteFeedback({ feedbackId });
          return feedbackErrorSchema.safeParse(result).success
            ? null
            : feedbackId;
        })
      );
      const deletedIds = results.flatMap((result) =>
        result.status === 'fulfilled' && result.value !== null
          ? [result.value]
          : []
      );
      setFeedbacks((currentFeedbacks) =>
        currentFeedbacks.filter(({ id }) => !deletedIds.includes(id))
      );
      setSelectedFeedbacks([]);
    } finally {
      setDeleting(false);
    }
  }

  function toggleSelection(feedbackId: number) {
    setSelectedFeedbacks((currentSelection) =>
      currentSelection.includes(feedbackId)
        ? currentSelection.filter((id) => id !== feedbackId)
        : [...currentSelection, feedbackId]
    );
  }

  return (
    <section
      aria-labelledby='feedback-heading'
      className='rounded-2xl border border-border bg-card p-5 shadow-sm'
    >
      <div className='mb-5 flex items-start justify-between gap-4'>
        <div>
          <div className='mb-2 flex items-center gap-2 text-muted-foreground'>
            <MessageSquareText className='h-4 w-4' />
            <span className='text-sm font-medium'>Feedback queue</span>
          </div>
          <h2 id='feedback-heading' className='text-xl font-semibold'>
            Messages to review
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            Select messages to remove once you are finished with them.
          </p>
        </div>
        <span className='whitespace-nowrap rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground'>
          {feedbacks.length} item{feedbacks.length === 1 ? '' : 's'}
        </span>
      </div>

      {error && <p className='text-sm text-destructive'>{error}</p>}

      {feedbacks.length === 0 && !error ? (
        <p className='rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground'>
          Nothing waiting for you here.
        </p>
      ) : (
        <div className='grid gap-3'>
          {feedbacks.map((feedback) => {
            const selected = selectedFeedbacks.includes(feedback.id);
            const createdAt = feedback.createdAt
              .replace('T', ' ')
              .substring(0, 19);
            return (
              <button
                key={feedback.id}
                type='button'
                className={`rounded-xl border p-4 text-left transition ${
                  selected
                    ? 'border-primary-kp/60 bg-primary-kp/10 ring-1 ring-primary-kp/40'
                    : 'border-border bg-muted/30 hover:border-primary-kp/40 hover:bg-muted/60'
                }`}
                aria-pressed={selected}
                onClick={() => toggleSelection(feedback.id)}
              >
                <div className='flex items-baseline justify-between gap-3'>
                  <span className='font-medium'>{feedback.createdBy}</span>
                  <span className='shrink-0 text-xs text-muted-foreground'>
                    {createdAt}
                  </span>
                </div>
                <p className='mt-2 break-words text-sm'>{feedback.comment}</p>
                <p className='mt-3 text-xs text-muted-foreground'>
                  From {feedback.originPath}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {selectedFeedbacks.length > 0 && (
        <div className='mt-5 flex justify-end'>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={deleting} variant='destructive'>
                Delete {selectedFeedbacks.length} selected
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete selected feedback?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the {selectedFeedbacks.length}{' '}
                  selected feedback item
                  {selectedFeedbacks.length === 1 ? '' : 's'}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  onClick={handleDelete}
                >
                  Delete selected
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </section>
  );
}
