import { ButtonGroup } from '@/components/ui/button-group';
import { MilestonesButton } from '@/components/ui/MilestonesButton';
import { Separator } from '@/components/ui/separator';
import useMilestones from '@/hooks/milestones/useMilestones';
import {
  ClientMilestone,
  DiffPeriod,
  diffPeriodEnum,
} from '@/lib/types/milestones';
import { capitaliseWords } from '@/lib/utils';

export default function TimePeriodButtonGroup({
  milestones,
  diffPeriod,
  setDiffPeriod,
}: {
  milestones: ClientMilestone[];
  diffPeriod: DiffPeriod;
  setDiffPeriod: ReturnType<typeof useMilestones>['state']['setDiffPeriod'];
}) {
  if (milestones.length === 0) {
    return null;
  }
  return (
    <>
      <div className='flex justify-center'>
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
      <Separator className='mx-auto my-4' />
    </>
  );
}
