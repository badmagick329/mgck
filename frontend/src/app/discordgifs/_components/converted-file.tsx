import { Checkbox } from '@/components/ui/checkbox';
import { sizeInfo } from '@/lib/discordgifs/frame-size-calculator';
import { FFmpegFileData } from '@/lib/types';

const targetChoices = Object.keys(sizeInfo) as Array<keyof typeof sizeInfo>;

export default function ConvertedFile({
  fileData,
  setTargets,
}: {
  fileData: FFmpegFileData;
  setTargets: (targets: Array<keyof typeof sizeInfo>) => void;
}) {
  const {
    file,
    outputUrls,
    outputNames,
    progress,
    size,
    isConverting,
    isDone,
  } = fileData;
  if (!file) {
    return null;
  }
  const fileSizeText = `${(file.size / 1024).toFixed(1)} KiB`;
  const convertedSizeText = size ? `- ${(size / 1024).toFixed(1)} KiB` : '';

  return (
    <div className='flex min-h-24 w-full items-center justify-center gap-4 rounded-md border-2 border-white px-2 py-4'>
      <p>
        {file.name} {convertedSizeText}
      </p>
      {targetChoices.map((choice, idx) => {
        return (
          <div key={choice}>
            <Checkbox
              id={choice}
              checked={fileData.targets.includes(choice)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setTargets([...fileData.targets, choice]);
                } else {
                  setTargets(fileData.targets.filter((t) => t !== choice));
                }
              }}
              disabled={isConverting || isDone}
            />
            <label
              htmlFor={choice}
              className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
            >
              {choice}
            </label>
          </div>
        );
      })}
      <div className='flex gap-4'>
        {outputUrls.map((url, i) => {
          return (
            <a
              key={url}
              href={url}
              download={outputNames[i]}
              className='text-primary'
            >
              {outputNames[i]}
            </a>
          );
        })}
      </div>
    </div>
  );
}
