import { emojifyText } from '@/lib/utils';
import { useMemo, useState } from 'react';

import EmojifyButtons from './emojify-buttons';

type OutputFieldProps = {
  messageInput: string;
  emojisInput: string;
  setEmojisInput: (emojisInput: string) => void;
  username: string;
  showAi: boolean;
};

export default function OutputField({
  messageInput,
  emojisInput,
  setEmojisInput,
  username,
  showAi,
}: OutputFieldProps) {
  const [output, setOutput] = useState<string>('');

  useMemo(() => {
    setOutput(emojifyText(messageInput, emojisInput));
  }, [messageInput, emojisInput]);

  return (
    <>
      <div className='flex justify-between'>
        <EmojifyButtons
          messageInput={messageInput}
          emojisInput={emojisInput}
          setEmojisInput={setEmojisInput}
          setOutput={setOutput}
          output={output}
          username={username}
          showAi={showAi}
        />
      </div>
      <span className='bg-background-em-dark/10 dark:bg-background-em-dark rounded-md border-2 p-2'>
        {output}
      </span>
    </>
  );
}
