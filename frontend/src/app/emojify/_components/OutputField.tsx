'use client';
import { useState } from 'react';

import EmojifyButtons from './EmojifyButtons';

type OutputFieldProps = {
  username: string;
  showAi: boolean;
};

export default function OutputField({ username, showAi }: OutputFieldProps) {
  const [output, setOutput] = useState<string>('');

  return (
    <section className='flex pb-2 flex-col flex-wrap'>
      <EmojifyButtons
        setOutput={setOutput}
        output={output}
        username={username}
        showAi={showAi}
      />
      <section className='bg-background-em-dark/10 dark:bg-background-em-dark rounded-md border-2 p-2'>
        <abbr
          className='no-underline justify-self-start'
          title='Emojified message will appear here'
        >
          <span className='flex flex-wrap break-all'>{output}</span>
        </abbr>
      </section>
    </section>
  );
}
