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
  GetChoices,
  GetCriteriaValues,
  GetCriterionValue,
  SetValue,
} from '@/hooks/use-choices-state';
import { truncateText } from '@/lib/utils';

import Instruction from './Instruction';

type ChoicesTableProps = {
  getChoices: GetChoices;
  getCriteriaValues: GetCriteriaValues;
  setValue: SetValue;
  getCriterionValue: GetCriterionValue;
  minValue: number;
  maxValue: number;
};

export default function ChoicesTable({
  getChoices,
  getCriteriaValues,
  setValue,
  getCriterionValue,
  minValue,
  maxValue,
}: ChoicesTableProps) {
  if (getChoices().length === 0) {
    return null;
  }
  const instructionText =
    '4. Adjust the values for each option using the slider.';

  return (
    <div className='flex w-full flex-col py-4'>
      <Instruction text={instructionText} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Values</TableHead>
            <TableHead className='text-right'>Option</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {getChoices().map((c) => {
            return (
              <TableRow key={c}>
                <TableCell>
                  <div className='flex flex-wrap gap-2'>
                    {Object.entries(getCriteriaValues(c)).map((entry) => {
                      const value = getCriterionValue(c, entry[0]);
                      const sliderValue =
                        (value || 0) * (125 / maxValue) - 125 / maxValue;
                      return (
                        <div
                          key={`${c}_${entry[0]}}`}
                          className='flex w-[80px] flex-col gap-2'
                        >
                          <div className='flex flex-col gap-2'>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className='break-words'>
                                    {truncateText(entry[0])}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <span>{entry[0]}</span>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <span>{value}</span>
                          </div>
                          <Slider
                            defaultValue={[1]}
                            max={maxValue}
                            min={minValue}
                            step={1}
                            sliderValue={sliderValue}
                            onValueChange={(e: Array<number>) => {
                              setValue(entry[0], c, e[0]);
                            }}
                          />
                        </div>
                      );
                    })}
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
