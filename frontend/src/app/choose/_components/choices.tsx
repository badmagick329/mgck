'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AddChoice,
  GetChoices,
  GetCriteria,
  GetCriteriaValues,
  GetCriterionValue,
  RemoveChoice,
  SetValue,
} from '@/hooks/use-choices-state';
import { useState } from 'react';

import ChoicesTable from './choices-table';
import Instruction from './instruction';
import Spacer from './spacer';

type ChoicesProps = {
  addChoice: AddChoice;
  getChoices: GetChoices;
  setValue: SetValue;
  removeChoice: RemoveChoice;
  getCriteriaValues: GetCriteriaValues;
  getCriterionValue: GetCriterionValue;
  getCriteria: GetCriteria;
  minValue: number;
  maxValue: number;
};

export default function Choices({
  addChoice,
  getChoices,
  setValue,
  removeChoice,
  getCriteriaValues,
  getCriterionValue,
  getCriteria,
  minValue,
  maxValue,
}: ChoicesProps) {
  const [choiceInput, setChoiceInput] = useState('');
  if (getCriteria().length === 0) {
    return null;
  }
  const instructionText = '3. Add the options you want to compare.';

  function handleAdd() {
    const trimmedInput = choiceInput.trim().slice(0, 150);
    if (!trimmedInput || getChoices().includes(trimmedInput)) {
      return;
    }

    addChoice(trimmedInput);
    setChoiceInput('');
  }

  return (
    <div className='flex w-full flex-col gap-4 pt-6'>
      <Instruction text={instructionText} />
      <div className='flex gap-2'>
        <Input
          onChange={(e) => setChoiceInput(e.target.value)}
          value={choiceInput}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <div>
          <Button onClick={handleAdd}>Add</Button>
        </div>
      </div>
      <Spacer />
      <ChoicesTable
        getCriterionValue={getCriterionValue}
        getChoices={getChoices}
        getCriteriaValues={getCriteriaValues}
        setValue={setValue}
        minValue={minValue}
        maxValue={maxValue}
      />
    </div>
  );
}
