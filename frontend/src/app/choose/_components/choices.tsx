import { Button } from '@/components/ui/button';
import { GetChoices, RemoveChoice, SetValue } from '@/hooks/use-choices-state';

type ChoicesProps = {
  getChoices: GetChoices;
  setValue: SetValue;
  removeChoice: RemoveChoice;
};

export default function Choices({
  getChoices,
  setValue,
  removeChoice,
}: ChoicesProps) {
  return (
    <div>
      <Button>Add choice</Button>
    </div>
  );
}
