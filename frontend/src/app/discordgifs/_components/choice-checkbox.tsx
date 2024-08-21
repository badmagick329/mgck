import { Checkbox } from '@/components/ui/checkbox-dg';
import { sizeInfo } from '@/lib/ffmpeg-utils/frame-size-calculator';
import { FFmpegConversionState } from '@/lib/types';
import { capitaliseWords } from '@/lib/utils';

type SizeInfoKey = keyof typeof sizeInfo;
export default function ChoiceCheckbox({
  key,
  choice,
  outputTypes,
  setOutputTypes,
  conversionState,
}: {
  key: string;
  choice: SizeInfoKey;
  outputTypes: Array<SizeInfoKey>;
  setOutputTypes: (targets: Array<SizeInfoKey>) => void;
  conversionState: FFmpegConversionState;
}) {
  return (
    <div className='flex items-center gap-2'>
      <Checkbox
        id={key}
        checked={outputTypes.includes(choice)}
        onCheckedChange={(checked) => {
          if (checked) {
            setOutputTypes([...outputTypes, choice]);
          } else {
            setOutputTypes(outputTypes.filter((t) => t !== choice));
          }
        }}
        disabled={conversionState !== 'idle'}
      />
      <label
        htmlFor={key}
        className='text-sm font-medium leading-none hover:cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
      >
        {capitaliseWords(choice)}
      </label>
    </div>
  );
}
