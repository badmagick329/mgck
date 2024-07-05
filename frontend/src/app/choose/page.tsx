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
    addChoice,
    getCriteriaValues,
    getCriterionValue,
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
        addChoice={addChoice}
        getChoices={getChoices}
        setValue={setValue}
        removeChoice={removeChoice}
        getCriteriaValues={getCriteriaValues}
        getCriterionValue={getCriterionValue}
      />
    </div>
  );
}
