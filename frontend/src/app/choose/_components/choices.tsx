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

type ChoicesProps = {
  addChoice: AddChoice;
  getChoices: GetChoices;
  setValue: SetValue;
  removeChoice: RemoveChoice;
  getCriteriaValues: GetCriteriaValues;
  getCriterionValue: GetCriterionValue;
  getCriteria: GetCriteria;
};

export default function Choices({
  addChoice,
  getChoices,
  setValue,
  removeChoice,
  getCriteriaValues,
  getCriterionValue,
  getCriteria,
}: ChoicesProps) {
  const [choiceInput, setChoiceInput] = useState('');
  if (getCriteria().length === 0) {
    return null;
  }
  const instructionText = '3. Add the options you want to compare.';

  return (
    <div className='flex flex-col gap-4 px-2 pt-6'>
      <Instruction text={instructionText} />
      <div className='flex gap-2'>
        <Input
          onChange={(e) => setChoiceInput(e.target.value)}
          value={choiceInput}
        />
        <div>
          <Button
            onClick={() => {
              const trimmedInput = choiceInput.trim();
              if (!trimmedInput || getChoices().includes(trimmedInput)) {
                return;
              }

              addChoice(trimmedInput);
              setChoiceInput('');
            }}
          >
            Add
          </Button>
        </div>
      </div>
      <ChoicesTable
        getCriterionValue={getCriterionValue}
        getChoices={getChoices}
        getCriteriaValues={getCriteriaValues}
        setValue={setValue}
      />
    </div>
  );
}
