'use client';

import useChoicesState from '@/hooks/use-choices-state';

import ChartOutput from './_components/chart-output';
import Choices from './_components/choices';
import Criteria from './_components/criteria';
import Spacer from './_components/spacer';

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
    <div className='flex flex-col items-center gap-6 px-2 pt-6'>
      <div className='flex w-full max-w-[720px] flex-col md:max-w-[80%] 2xl:max-w-[70%]'>
        <Criteria
          setCriterion={setCriterion}
          getWeight={getWeight}
          getCriteria={getCriteria}
          removeCriterion={removeCriterion}
        />
        <Spacer />
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
        <Spacer />
        <div className='flex justify-center p-4'>
          <ChartOutput chartData={results} />
        </div>
      </div>
    </div>
  );
}
