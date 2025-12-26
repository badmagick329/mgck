import { ButtonGroup } from '@/components/ui/button-group';
import { MilestonesButton } from '@/components/ui/MilestonesButton';
import { Separator } from '@/components/ui/separator';
import useMilestones from '@/hooks/milestones/useMilestones';
import { DiffPeriod, diffPeriodEnum } from '@/lib/types/milestones';
import { capitaliseWords } from '@/lib/utils';

export default function TimePeriodButtonGroup({
  diffPeriod,
  setDiffPeriod,
}: {
  diffPeriod: DiffPeriod;
  setDiffPeriod: ReturnType<typeof useMilestones>['state']['setDiffPeriod'];
}) {
  return (
    <>
      <MobileView diffPeriod={diffPeriod} setDiffPeriod={setDiffPeriod} />
      <StandardView diffPeriod={diffPeriod} setDiffPeriod={setDiffPeriod} />
      <Separator className='mx-auto my-4' />
    </>
  );
}

function MobileView({
  diffPeriod,
  setDiffPeriod,
}: {
  diffPeriod: DiffPeriod;
  setDiffPeriod: ReturnType<typeof useMilestones>['state']['setDiffPeriod'];
}) {
  return (
    <div className='flex flex-col items-center gap-2 xs:hidden'>
      <ButtonGroup>
        {diffPeriodEnum.options
          .slice(0, Math.ceil(diffPeriodEnum.options.length / 2))
          .map((period) => (
            <MilestonesButton
              key={period}
              appVariant='milestonesSecondary'
              onClick={() => setDiffPeriod(period)}
              disabled={diffPeriod === period}
              className='font-semibold'
            >
              {capitaliseWords(period)}
            </MilestonesButton>
          ))}
      </ButtonGroup>

      <ButtonGroup>
        {diffPeriodEnum.options
          .slice(Math.ceil(diffPeriodEnum.options.length / 2))
          .map((period) => (
            <MilestonesButton
              key={period}
              appVariant='milestonesSecondary'
              onClick={() => setDiffPeriod(period)}
              disabled={diffPeriod === period}
              className='font-semibold'
            >
              {capitaliseWords(period)}
            </MilestonesButton>
          ))}
      </ButtonGroup>
    </div>
  );
}

function StandardView({
  diffPeriod,
  setDiffPeriod,
}: {
  diffPeriod: DiffPeriod;
  setDiffPeriod: ReturnType<typeof useMilestones>['state']['setDiffPeriod'];
}) {
  return (
    <div className='hidden justify-center xs:flex'>
      <ButtonGroup>
        {diffPeriodEnum.options.map((period) => (
          <MilestonesButton
            key={period}
            appVariant='milestonesSecondary'
            onClick={() => setDiffPeriod(period)}
            disabled={diffPeriod === period}
            className='font-semibold'
          >
            {capitaliseWords(period)}
          </MilestonesButton>
        ))}
      </ButtonGroup>
    </div>
  );
}
