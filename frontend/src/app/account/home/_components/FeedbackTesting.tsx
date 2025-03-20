'use client';

import { useFeedback } from '@/hooks/useFeedback';
import {
  feedbackCreationSuccessSchema,
  feedbackErrorSchema,
  feedbackSchema,
  feedbacksSuccessSchema,
} from '@/lib/types/feedback';
import { useState } from 'react';

export default function FeedbackTesting() {
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const [feedbackId, setFeedbackId] = useState(0);
  const { getFeedback, createFeedback, deleteFeedback } = useFeedback();

  return (
    <div className='flex flex-col'>
      <div className='flex w-full justify-center gap-4'>
        <button
          className='bg-green-500 px-4 py-2'
          onClick={async () => {
            const resp = await getFeedback();
            const parsed = feedbacksSuccessSchema.safeParse(resp);
            if (parsed.success) {
              setOutput(JSON.stringify(parsed.data.data.feedbacks, null, 2));
              return;
            }
            const errorParsed = feedbackErrorSchema.safeParse(resp);
            if (errorParsed.success) {
              setOutput(JSON.stringify(errorParsed.data.data.errors, null, 2));
              return;
            }
            setOutput('Unknown error occurred');
          }}
        >
          Get Feedback
        </button>
      </div>
      <textarea rows={15} value={output} />
      <div className='flex w-full justify-center gap-4'>
        <button
          className='bg-yellow-500 px-4 py-2'
          onClick={async () => {
            const result = await createFeedback({
              comment: input,
              createdBy: '',
            });
            const parsed = feedbackCreationSuccessSchema.safeParse(result);
            setInput('');
            if (parsed.success) {
              setOutput(JSON.stringify(parsed.data.data, null, 2));
              return;
            }

            const errorParse = feedbackErrorSchema.safeParse(result);
            if (errorParse.success) {
              setOutput(JSON.stringify(errorParse.data.data.errors, null, 2));
              return;
            }

            setOutput('Unknown error occurred');
          }}
        >
          Post Feedback
        </button>
      </div>
      <textarea
        rows={10}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className='flex w-full justify-center gap-4'>
        <button
          className='bg-red-500 px-4 py-2'
          onClick={async () => {
            const result = await deleteFeedback({ feedbackId });
            const parsed = feedbackSchema.safeParse(result);
            if (parsed.success) {
              setOutput(JSON.stringify(parsed.data, null, 2));
            }
            setOutput(`Deleted ${feedbackId}`);
          }}
        >
          Delete Feedback
        </button>
        <input
          type='number'
          value={feedbackId}
          onChange={(e) => setFeedbackId(parseInt(e.target.value))}
        />
      </div>
    </div>
  );
}
