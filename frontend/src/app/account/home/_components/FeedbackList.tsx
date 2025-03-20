'use client';

import { useFeedback } from '@/hooks/useFeedback';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useEffect, useState } from 'react';
import {
  Feedback,
  feedbackErrorSchema,
  feedbacksSuccessSchema,
} from '@/lib/types/feedback';
import { Button } from '@/components/ui/button';

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
        setError('Failed to fetch feedbacks');
      }
    };
    fetchFeedbacks();
  }, []);

  async function handleDelete() {
    setDeleting(true);
    try {
      const deletionPromises = selectedFeedbacks.map(async (id) => {
        try {
          const result = await deleteFeedback({ feedbackId: id });
          const parsed = feedbackErrorSchema.safeParse(result);
          if (parsed.success) {
            console.error(parsed.data.data);
            return null;
          }
          return id;
        } catch (error) {
          console.error(`Failed to delete feedback ${id}:`, error);
          return null;
        }
      });

      const results = await Promise.allSettled(deletionPromises);
      const deletedIds = results
        .filter(
          (result) => result.status === 'fulfilled' && result.value !== null
        )
        .map((result) =>
          result.status === 'fulfilled' ? result.value : null
        ) as number[];

      setFeedbacks((prevFeedbacks) =>
        prevFeedbacks.filter((f) => !deletedIds.includes(f.id))
      );
      setSelectedFeedbacks([]);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className='grid gap-2 pt-6'>
      <div className='flex justify-center'>
        <Button
          disabled={deleting}
          onClick={handleDelete}
          variant={'destructive'}
        >
          Delete Selected
        </Button>
      </div>
      <section className='grid-auto-fill-md'>
        <FeedbackCards
          feedbacks={feedbacks}
          selectedFeedbacks={selectedFeedbacks}
          setSelectedFeedbacks={setSelectedFeedbacks}
        />
      </section>
    </article>
  );
}

function FeedbackCards({
  feedbacks,
  selectedFeedbacks,
  setSelectedFeedbacks,
}: {
  feedbacks: Feedback[];
  selectedFeedbacks: number[];
  setSelectedFeedbacks: React.Dispatch<React.SetStateAction<number[]>>;
}) {
  return (
    <>
      {feedbacks.map((f) => {
        const createdAt = f.createdAt.replace('T', ' ').substring(0, 19);
        const isSelected = selectedFeedbacks.includes(f.id);
        return (
          <div key={f.id}>
            <Card
              className={isSelected ? 'bg-secondary' : 'bg-background'}
              onClick={() => {
                if (isSelected) {
                  setSelectedFeedbacks(
                    selectedFeedbacks.filter((id) => id !== f.id)
                  );
                } else {
                  setSelectedFeedbacks([...selectedFeedbacks, f.id]);
                }
              }}
            >
              <CardHeader>
                <CardTitle>{f.createdBy}</CardTitle>
                <CardDescription>{createdAt}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='break-words'>{f.comment}</p>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </>
  );
}
