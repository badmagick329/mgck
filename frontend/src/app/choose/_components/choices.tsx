import { Button } from '@/components/ui/button';
import { ChooseState } from '@/lib/types';
import { Dispatch, SetStateAction } from 'react';

type ChoicesProps = {
  useChooseState: Dispatch<SetStateAction<ChooseState | undefined>>;
  chooseState?: ChooseState;
};

export default function Choices({ chooseState, useChooseState }: ChoicesProps) {
  return (
    <div>
      <Button>Add choice</Button>
    </div>
  );
}
