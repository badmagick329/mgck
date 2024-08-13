import { Button } from '@/components/ui/button';
import { FFmpegFileData } from '@/lib/types';

export default function ConvertedFile({
  fileData,
}: {
  fileData: FFmpegFileData;
}) {
  const { file, outputUrl, outputName, progress, size, isConverting, isDone } =
    fileData;
  if (!file) {
    return null;
  }
  const fileSizeText = `${(file.size / 1024).toFixed(1)} KiB`;
  const convertedSizeText = size ? `- ${(size / 1024).toFixed(1)} KiB` : '';
  const discordLimitText = convertedSizeText
    ? ` (Discord limit: ${256} KiB)`
    : '';

  return (
    <div className='flex min-h-24 w-full items-center justify-center gap-4 rounded-md border-2 border-white px-2 py-4'>
      <p>
        {file.name} {convertedSizeText}
        {discordLimitText}
      </p>
      <div>
        <Button disabled={!isDone}>
          <a href={outputUrl} download={outputName}>
            {isConverting ? 'Converting...' : 'Download'}
          </a>
        </Button>
      </div>
    </div>
  );
}
