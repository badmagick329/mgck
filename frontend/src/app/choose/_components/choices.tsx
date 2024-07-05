'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AddChoice,
  GetChoices,
  GetCriteriaValues,
  GetCriterionValue,
  RemoveChoice,
  SetValue,
} from '@/hooks/use-choices-state';
import { useState } from 'react';

import ChoicesTable from './choices-table';

type ChoicesProps = {
  addChoice: AddChoice;
  getChoices: GetChoices;
  setValue: SetValue;
  removeChoice: RemoveChoice;
  getCriteriaValues: GetCriteriaValues;
  getCriterionValue: GetCriterionValue;
};

export default function Choices({
  addChoice,
  getChoices,
  setValue,
  removeChoice,
  getCriteriaValues,
  getCriterionValue,
}: ChoicesProps) {
  const [choiceInput, setChoiceInput] = useState('');

  return (
    <div className='flex w-[100%] max-w-[720px] flex-col gap-4 px-2 md:w-[80%]'>
      <div className='flex justify-center'>
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
          Add choice
        </Button>
      </div>
      <Input
        onChange={(e) => setChoiceInput(e.target.value)}
        value={choiceInput}
      />
      <ChoicesTable
        getCriterionValue={getCriterionValue}
        getChoices={getChoices}
        getCriteriaValues={getCriteriaValues}
        setValue={setValue}
      />
    </div>
  );
}
