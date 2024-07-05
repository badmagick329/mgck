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

type ChoicesTableProps = {
  getChoices: GetChoices;
  getCriteriaValues: GetCriteriaValues;
  setValue: SetValue;
  getCriterionValue: GetCriterionValue;
};

export default function ChoicesTable({
  getChoices,
  getCriteriaValues,
  setValue,
  getCriterionValue,
}: ChoicesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Values</TableHead>
          <TableHead className='text-right'>Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {getChoices().map((c) => {
          return (
            <TableRow key={c}>
              <TableCell>
                <div className='flex gap-2'>
                  {Object.entries(getCriteriaValues(c)).map((entry) => {
                    return (
                      <div
                        key={`${c}_${entry[0]}}`}
                        className='flex w-[60px] flex-col gap-2'
                      >
                        <div className='flex flex-col gap-2'>
                          <span>{entry[0]}</span>
                          <span>{getCriterionValue(c, entry[0])}</span>
                        </div>
                        <Slider
                          defaultValue={[1]}
                          max={5}
                          min={1}
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
  );
}
