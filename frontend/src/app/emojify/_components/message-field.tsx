import { Textarea } from "@/components/ui/textarea";

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
      className="bg-gray-300 rounded-md p-2 dark:bg-gray-800"
      onChange={(e) => setMessageInput(e.target.value)}
      placeholder="Enter your message here"
      value={messageInput}
    />
  );
}
