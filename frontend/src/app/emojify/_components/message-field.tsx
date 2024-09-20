import { Textarea } from '@/components/ui/textarea';

type MessageFieldProps = {
  messageInput: string;
  setMessageInput: (messageInput: string) => void;
};

export default function MessageField({
  messageInput,
  setMessageInput,
}: MessageFieldProps) {
  return (
    <Textarea
      className='bg-background-em-dark/10 dark:bg-background-em-dark rounded-md p-2'
      onChange={(e) => setMessageInput(e.target.value)}
      placeholder='Enter your message here'
      value={messageInput}
    />
  );
}
