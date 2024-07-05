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
  SetValue,
} from '@/hooks/use-choices-state';

type ChoicesTableProps = {
  getChoices: GetChoices;
  getCriteriaValues: GetCriteriaValues;
  setValue: SetValue;
};

export default function ChoicesTable({
  getChoices,
  getCriteriaValues,
  setValue,
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
                        <span>{entry[0]}</span>
                        <Slider
                          defaultValue={[1]}
                          max={5}
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
