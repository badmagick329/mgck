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
  GetCriteria,
  GetWeight,
  SetCriterion,
} from '@/hooks/use-choices-state';

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
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Weight</TableHead>
          <TableHead className='text-right'>Name</TableHead>
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
                    step={1}
                    onValueChange={(e: Array<number>) => {
                      setCriterion(c, e[0]);
                    }}
                  />
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
