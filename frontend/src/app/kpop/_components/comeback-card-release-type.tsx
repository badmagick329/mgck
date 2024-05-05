export default function ComebackCardReleaseType({
  releaseType,
}: {
  releaseType: string;
}) {
  return (
    <span className='text-xs font-bold text-gray-600 dark:text-gray-400'>
      {releaseType}
    </span>
  );
}
