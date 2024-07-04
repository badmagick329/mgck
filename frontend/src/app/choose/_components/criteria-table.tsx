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
import { useState } from 'react';

export default function CriteriaTable({
  criteria,
}: {
  criteria: CriterionType[];
}) {
  const [weight, setWeight] = useState(50);

  return (
    <Table>
      <TableCaption>Choice Criteria</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Weight</TableHead>
          <TableHead className='text-right'>Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {criteria.map((c) => {
          return (
            <TableRow key={c.label}>
              <TableCell>
                <div>
                  <span>{weight}</span>
                  <Slider
                    defaultValue={[50]}
                    max={100}
                    step={1}
                    onValueChange={(e: Array<number>) => setWeight(e[0])}
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
