'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useFeedback } from '@/hooks/useFeedback';
import {
  feedbackCreationSuccessSchema,
  feedbackErrorSchema,
} from '@/lib/types/feedback';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { topRightDefaultToast } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

const FormSchema = z.object({
  name: z.string(),
  comment: z.string().min(10),
});

export default function FeedbackForm() {
  const [open, setOpen] = useState(false);
  const { createFeedback } = useFeedback();
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      comment: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    shouldFocusError: true,
  });

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      const offset = (window.innerHeight - viewport.height) / 2;
      setKeyboardOffset(offset);
    };

    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const result = await createFeedback({
      comment: data.comment,
      createdBy: data.name,
    });
    const parsed = feedbackCreationSuccessSchema.safeParse(result);
    if (parsed.success) {
      topRightDefaultToast('Feedback Submitted', toast, 3000);
      setOpen(false);
      form.reset();
      return;
    }

    const errorParsed = feedbackErrorSchema.safeParse(result);
    if (errorParsed.success) {
      topRightDefaultToast(
        errorParsed.data.data.errors[0],
        toast,
        5000,
        'destructive'
      );
    } else {
      topRightDefaultToast(
        'An unexpected error occurred.',
        toast,
        5000,
        'destructive'
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          className='h-10 w-10 border-none p-1 hover:scale-110'
        >
          <MessageSquare />
        </Button>
      </DialogTrigger>
      <DialogContent
        className='sm:max-w-[425px]'
        style={{
          transform: `translate(-50%, calc(-50% - ${keyboardOffset}px))`,
        }}
      >
        <Form {...form}>
          <form className='grid gap-2' onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Feedback</DialogTitle>
              <DialogDescription>
                Submit feedback or report a bug
              </DialogDescription>
            </DialogHeader>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name (Optional)</FormLabel>
                  <FormControl>
                    <Input autoComplete={'off'} placeholder='Name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='comment'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Comment'
                      rows={4}
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (e.target.value.length >= 10) {
                          form.clearErrors('comment');
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <div className='flex justify-end'>
                <Button type='submit' disabled={form.formState.isSubmitting}>
                  Submit
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
      <Toaster />
    </Dialog>
  );
}
