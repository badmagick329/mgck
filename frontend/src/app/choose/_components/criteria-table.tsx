import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CriterionType } from '@/lib/types';

export default function CriteriaTable({
  criteria,
}: {
  criteria: CriterionType[];
}) {
  return (
    // <div className='flex flex-col gap-2'>
    //   {criteria.map((c, index) => (
    //     <Criterion key={index} label={c.label} />
    //   ))}
    // </div>
    <Table>
      <TableCaption>Choice Criteria</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Weight</TableHead>
          <TableHead>MaxValue</TableHead>
          <TableHead className='text-right'>Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {criteria.map((c) => {
          return (
            <TableRow key={c.label}>
              <TableCell>
                <div>
                  <span>{c.weight}</span>
                  <Slider
                    defaultValue={[50]}
                    max={100}
                    step={1}
                    onValueChange={(e: Array<number>) => console.log(e[0])}
                  />
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <span>{c.maxValue}</span>
                  <Slider
                    defaultValue={[1]}
                    max={c.maxValue}
                    step={0.1}
                    onValueChange={(e: Array<number>) => console.log(e[0])}
                  />
                </div>
              </TableCell>
              <TableCell className='text-right'>{c.label}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
