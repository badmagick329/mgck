import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  GetCriteria,
  GetWeight,
  SetCriterion,
} from '@/hooks/use-choices-state';
import { truncateText } from '@/lib/utils';

import Instruction from './instruction';

type CriteriaTableProps = {
  getCriteria: GetCriteria;
  getWeight: GetWeight;
  setCriterion: SetCriterion;
};

export default function CriteriaTable({
  getCriteria,
  getWeight,
  setCriterion,
}: CriteriaTableProps) {
  if (getCriteria().length === 0) {
    return null;
  }
  const instructionText =
    '2. Adjust the importance for each criterion using the slider.';

  return (
    <div className='flex flex-col py-4'>
      <Instruction text={instructionText} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Importance</TableHead>
            <TableHead className='text-right'>Criterion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {getCriteria().map((c) => {
            return (
              <TableRow key={c}>
                <TableCell>
                  <div>
                    <span>{getWeight(c)}</span>
                    <Slider
                      defaultValue={[getWeight(c)]}
                      max={100}
                      min={1}
                      step={1}
                      sliderValue={getWeight(c)}
                      onValueChange={(e: Array<number>) => {
                        setCriterion(c, e[0]);
                      }}
                    />
                  </div>
                </TableCell>
                <TableCell className='text-right'>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className='break-words'>{truncateText(c)}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>{c}</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
