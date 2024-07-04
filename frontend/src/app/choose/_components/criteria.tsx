'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import Criterion from './criterion';
import { ChooseState, CriterionType } from '@/lib/types';
import { Dispatch, SetStateAction, useState } from 'react';

import CriteriaTable from './criteria-table';

type CriteriaProps = {
  useChooseState: Dispatch<SetStateAction<ChooseState | undefined>>;
  chooseState?: ChooseState;
};

export default function Criteria({
  chooseState,
  useChooseState,
}: CriteriaProps) {
  const [criteria, setCriteria] = useState<CriterionType[]>([]);
  const [criterionInput, setCriterionInput] = useState('');

  return (
    <div className='flex w-[100%] max-w-[720px] flex-col gap-4 px-2 md:w-[80%]'>
      <Button
        onClick={() => {
          if (!criterionInput) {
            return;
          }

          setCriteria([
            ...criteria,
            {
              label: criterionInput,
              weight: 1,
              maxValue: 4,
            },
          ]);
          setCriterionInput('');
        }}
      >
        Add criteria
      </Button>
      <Input
        onChange={(e) => setCriterionInput(e.target.value)}
        value={criterionInput}
      />
      {/* <div className='flex flex-col gap-2'>
        {criteria.map((c, index) => (
          <Criterion key={index} label={c} />
        ))}
      </div> */}
      <CriteriaTable criteria={criteria} />
    </div>
  );
}
