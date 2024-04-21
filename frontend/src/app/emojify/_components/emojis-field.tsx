import { Input } from "@/components/ui/input";

type EmojisFieldProps = {
  emojisInput: string;
  setEmojisInput: (emojisInput: string) => void;
};

export default function EmojisField({
  emojisInput,
  setEmojisInput,
}: EmojisFieldProps) {
  return (
    <>
      <Input
        className="bg-gray-300 rounded-md p-2 dark:bg-gray-800"
        onChange={(e) => setEmojisInput(e.target.value.slice(0, 1000))}
        value={emojisInput}
        placeholder="Enter emojis (or words) separated by spaces"
      />
      <span>
        Emojis will be picked from the above list at random. You can edit it and
        it will be saved in your browser. Use reset to bring back default list
      </span>
    </>
  );
}
