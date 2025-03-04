'use client';

import Navbar from '@/app/_components/Navbar';
import useChoicesState from '@/hooks/useChoicesState';

import ChartOutput from './_components/ChartOutput';
import Choices from './_components/Choices';
import Criteria from './_components/Criteria';
import Spacer from './_components/Spacer';

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
    <main className='flex min-h-dvh w-full flex-col'>
      <Navbar />
      <div className='flex w-full justify-center px-2'>
        <div className='flex w-full max-w-[800px] flex-col items-center'>
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
          <ChartOutput chartData={results} />
        </div>
      </div>
    </main>
  );
}
