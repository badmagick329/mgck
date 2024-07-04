'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  GetCriteria,
  GetWeight,
  RemoveCriterion,
  SetCriterion,
} from '@/hooks/use-choices-state';
import { useState } from 'react';

import CriteriaTable from './criteria-table';

type CriteriaProps = {
  setCriterion: SetCriterion;
  removeCriterion: RemoveCriterion;
  getCriteria: GetCriteria;
  getWeight: GetWeight;
};

export default function Criteria({
  getCriteria,
  setCriterion,
  removeCriterion,
  getWeight,
}: CriteriaProps) {
  const [criterionInput, setCriterionInput] = useState('');

  return (
    <div className='flex w-[100%] max-w-[720px] flex-col gap-4 px-2 md:w-[80%]'>
      <div className='flex justify-center'>
        <Button
          onClick={() => {
            const trimmedInput = criterionInput.trim();
            if (!trimmedInput || getCriteria().includes(trimmedInput)) {
              return;
            }

            setCriterion(trimmedInput);
            setCriterionInput('');
          }}
        >
          Add criteria
        </Button>
      </div>
      <Input
        onChange={(e) => setCriterionInput(e.target.value)}
        value={criterionInput}
      />
      <CriteriaTable
        getCriteria={getCriteria}
        getWeight={getWeight}
        setCriterion={setCriterion}
      />
    </div>
  );
}
