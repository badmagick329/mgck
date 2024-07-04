'use client';

import { ChooseState } from '@/lib/types';
import { useState } from 'react';

import Choices from './_components/choices';
import Criteria from './_components/criteria';

export default function ChoosePage() {
  const [chooseState, useChooseState] = useState<ChooseState | undefined>(
    undefined
  );

  return (
    <div className='flex flex-col items-center gap-2 pt-4'>
      <Criteria chooseState={chooseState} useChooseState={useChooseState} />
      <Choices chooseState={chooseState} useChooseState={useChooseState} />
    </div>
  );
}
