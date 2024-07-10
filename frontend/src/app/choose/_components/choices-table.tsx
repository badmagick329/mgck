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
  GetChoices,
  GetCriteriaValues,
  GetCriterionValue,
  SetValue,
} from '@/hooks/use-choices-state';

import Instruction from './instruction';

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
    <div className='flex flex-col py-4'>
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
                      return (
                        <div
                          key={`${c}_${entry[0]}}`}
                          className='flex w-[80px] flex-col gap-2'
                        >
                          <div className='flex flex-col gap-2'>
                            <span>{entry[0]}</span>
                            <span>{getCriterionValue(c, entry[0])}</span>
                          </div>
                          <Slider
                            defaultValue={[1]}
                            max={maxValue}
                            min={minValue}
                            step={1}
                            onValueChange={(e: Array<number>) => {
                              setValue(entry[0], c, e[0]);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </TableCell>
                <TableCell className='text-right'>{c}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
