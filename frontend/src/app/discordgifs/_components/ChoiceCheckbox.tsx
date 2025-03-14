import { Checkbox } from '@/components/ui/checkbox-dg';
import { sizeInfo } from '@/lib/discordgifs/frame-size-calculator';
import { capitaliseWords } from '@/lib/utils';

type SizeInfoKey = keyof typeof sizeInfo;
export default function ChoiceCheckbox({
  checkboxId,
  choice,
  outputTypes,
  setOutputTypes,
  buttonsEnabled,
}: {
  checkboxId: string;
  choice: SizeInfoKey;
  outputTypes: Array<SizeInfoKey>;
  setOutputTypes: (targets: Array<SizeInfoKey>) => void;
  buttonsEnabled: boolean;
}) {
  return (
    <div className='flex items-center gap-2'>
      <Checkbox
        id={checkboxId}
        checked={outputTypes.includes(choice)}
        onCheckedChange={(checked) => {
          if (checked) {
            setOutputTypes([...outputTypes, choice]);
          } else {
            setOutputTypes(outputTypes.filter((t) => t !== choice));
          }
        }}
        disabled={!buttonsEnabled}
      />
      <label
        htmlFor={checkboxId}
        className='text-sm font-medium leading-none hover:cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
      >
        {capitaliseWords(choice)}
      </label>
    </div>
  );
}
