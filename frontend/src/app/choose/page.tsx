'use client';

import { ThemeToggler } from '@/components/theme-toggler';
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
    <main className='flex min-h-screen w-full flex-col'>
      <div className='self-end p-2'>
        <ThemeToggler />
      </div>
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
