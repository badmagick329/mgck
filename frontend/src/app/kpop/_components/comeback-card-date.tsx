export default function ComebackCardDate({
  releaseDate,
}: {
  releaseDate: string;
}) {
  return (
    <span className='flex justify-end text-sm font-bold text-gray-600 dark:text-gray-400'>
      {releaseDate}
    </span>
  );
}
