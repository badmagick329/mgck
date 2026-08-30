import { Checkbox } from '@/components/ui/checkbox-dg';
import { ConversionPresetId } from '@/lib/discordgifs/conversion-target';
import { capitaliseWords } from '@/lib/utils';

export default function ChoiceCheckbox({
  checkboxId,
  choice,
  outputTypes,
  setOutputTypes,
  buttonsEnabled,
}: {
  checkboxId: string;
  choice: ConversionPresetId;
  outputTypes: Array<ConversionPresetId>;
  setOutputTypes: (targets: Array<ConversionPresetId>) => void;
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
