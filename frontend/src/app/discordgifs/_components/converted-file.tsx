import { Checkbox } from '@/components/ui/checkbox';
import { sizeInfo } from '@/lib/ffmpeg-utils/frame-size-calculator';
import { FFmpegFileData } from '@/lib/types';

const targetChoices = Object.keys(sizeInfo) as Array<keyof typeof sizeInfo>;

type ConvertedFileProps = {
  fileData: FFmpegFileData;
  setOutputTypes: (targets: Array<keyof typeof sizeInfo>) => void;
};

export default function ConvertedFile({
  fileData,
  setOutputTypes,
}: ConvertedFileProps) {
  const { file, outputs, progress, size, isConverting, isDone } = fileData;
  if (!file) {
    return null;
  }
  const fileSizeText = `${(file.size / 1024).toFixed(1)} KiB`;
  const convertedSizeText =
    size && isConverting ? `- ${(size / 1024).toFixed(1)} KiB` : '';

  return (
    <div className='flex min-h-24 w-full items-center justify-center gap-4 rounded-md border-2 border-white px-2 py-4'>
      <p>
        {file.name} {convertedSizeText}
      </p>
      {targetChoices.map((choice, idx) => {
        const key = `${file.name}-${choice}`;
        return (
          <div key={key}>
            <Checkbox
              id={key}
              checked={fileData.outputTypes.includes(choice)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setOutputTypes([...fileData.outputTypes, choice]);
                } else {
                  setOutputTypes(
                    fileData.outputTypes.filter((t) => t !== choice)
                  );
                }
              }}
              disabled={isConverting || isDone}
            />
            <label
              htmlFor={key}
              className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
            >
              {choice}
            </label>
          </div>
        );
      })}
      <div className='flex gap-4'>
        {outputs.map(({ url, name, finalSize }) => {
          const sizeText = finalSize
            ? ` - ${(finalSize / 1024).toFixed(1)}KiB`
            : '';
          return (
            <a key={url} href={url} download={name} className='text-primary'>
              {name}
              {sizeText}
            </a>
          );
        })}
      </div>
    </div>
  );
}
