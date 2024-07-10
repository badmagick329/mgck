'use client';

import useChoicesState from '@/hooks/use-choices-state';

import ChartOutput from './_components/chart-output';
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
    results,
    MIN_VALUE: minValue,
    MAX_VALUE: maxValue,
  } = useChoicesState();

  return (
    <div className='flex flex-col items-center gap-6 pt-16'>
      <div className='flex w-full max-w-[720px] flex-col md:max-w-[80%] 2xl:max-w-[70%]'>
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
          getCriteria={getCriteria}
          minValue={minValue}
          maxValue={maxValue}
        />
        <div className='flex justify-center p-4'>
          <ChartOutput chartData={results} />
        </div>
      </div>
    </div>
  );
}
