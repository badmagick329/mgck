'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import Criterion from './criterion';
import { CriterionType } from '@/lib/types';
import { useState } from 'react';

import CriteriaTable from './criteria-table';

export default function Criteria() {
  const [criteria, setCriteria] = useState<CriterionType[]>([]);
  const [criterionInput, setCriterionInput] = useState('');

  return (
    <div className='flex flex-col gap-4'>
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
