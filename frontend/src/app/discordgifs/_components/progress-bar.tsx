export default function ProgressBar({ progress }: { progress: number }) {
  let progressText = '';
  // if (progress > 0 && progress < 1) {
  if (progress > 0) {
    progressText = `${Math.round(progress * 100)}%`;
  }

  return (
    <div className='h-8 w-full rounded-md bg-gray-400'>
      <div
        className='flex h-full items-center justify-end rounded-md bg-green-500 px-2 font-semibold'
        style={{ width: `${progress * 100}%` }}
      >
        {progressText}
      </div>
    </div>
  );
}
