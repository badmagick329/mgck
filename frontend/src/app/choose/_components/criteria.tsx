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
import Instruction from './instruction';

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
  const instructionText =
    '1. Begin by adding the criteria to base your choice on.';

  function handleAdd() {
    const trimmedInput = criterionInput.trim();
    if (!trimmedInput || getCriteria().includes(trimmedInput)) {
      return;
    }

    setCriterion(trimmedInput);
    setCriterionInput('');
  }

  return (
    <div className='flex flex-col gap-4 px-2'>
      <Instruction text={instructionText} />
      <div className='flex gap-2'>
        <Input
          onChange={(e) => setCriterionInput(e.target.value)}
          value={criterionInput}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <div>
          <Button onClick={handleAdd}>Add</Button>
        </div>
      </div>
      <CriteriaTable
        getCriteria={getCriteria}
        getWeight={getWeight}
        setCriterion={setCriterion}
      />
    </div>
  );
}
