'use client';

import useChoicesState from '@/hooks/use-choices-state';

import Choices from './_components/choices';
import Criteria from './_components/criteria';

export default function ChoosePage() {
  const {
    setCriterion,
    getWeight,
    getCriteria,
    removeCriterion,
    getChoices,
    setValue,
    removeChoice,
  } = useChoicesState();

  return (
    <div className='flex flex-col items-center gap-2 pt-4'>
      <Criteria
        setCriterion={setCriterion}
        getWeight={getWeight}
        getCriteria={getCriteria}
        removeCriterion={removeCriterion}
      />
      <Choices
        getChoices={getChoices}
        setValue={setValue}
        removeChoice={removeChoice}
      />
    </div>
  );
}
