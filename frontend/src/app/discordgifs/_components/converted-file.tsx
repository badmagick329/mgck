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
  console.log('filedata isdone isconverting', isDone, isConverting);
  const convertedSizeText = size ? `- ${(size / 1024).toFixed(1)} KB` : '';
  const disabledButton = progress !== 1 && isDone;

  return (
    <div className='flex min-h-24 w-full flex-col gap-4 rounded-md border-2 border-white px-2 py-4'>
      <p>
        {file.name} - {`${(file.size / 1024).toFixed(1)}`} KB{' '}
        {convertedSizeText}
      </p>
      <div>
        <Button disabled={disabledButton}>
          <a href={outputUrl} download={outputName}>
            Download
          </a>
        </Button>
      </div>
      {isConverting && (
        <p className='font-semibold text-green-500'>Converting...</p>
      )}
      {isDone && <p className='font-semibold text-green-500'>Done!</p>}
      {/* {progress > 0 && <ProgressBar progress={progress} />} */}
    </div>
  );
}
