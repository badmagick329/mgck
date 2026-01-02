import { ButtonGroup } from '@/components/ui/button-group';
import { MilestonesButton } from '@/components/ui/MilestonesButton';
import { Separator } from '@/components/ui/separator';
import useMilestones from '@/hooks/milestones/useMilestones';
import { DiffPeriod, diffPeriodEnum } from '@/lib/types/milestones';
import { capitaliseWords } from '@/lib/utils';

type Props = {
  diffPeriod: DiffPeriod;
  setDiffPeriod: ReturnType<typeof useMilestones>['store']['setDiffPeriod'];
};

export default function TimePeriodButtonGroup({
  diffPeriod,
  setDiffPeriod,
}: Props) {
  return (
    <>
      <MobileView diffPeriod={diffPeriod} setDiffPeriod={setDiffPeriod} />
      <StandardView diffPeriod={diffPeriod} setDiffPeriod={setDiffPeriod} />
      <Separator className='mx-auto my-4 max-w-6xl' />
    </>
  );
}

function MobileView({ diffPeriod, setDiffPeriod }: Props) {
  return (
    <section className='flex flex-col items-center gap-2 xs:hidden'>
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
    </section>
  );
}

function StandardView({ diffPeriod, setDiffPeriod }: Props) {
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
