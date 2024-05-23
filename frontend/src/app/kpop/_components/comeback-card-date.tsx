import { dateStringIsToday } from '@/lib/utils/kpop';

export default function ComebackCardDate({
  releaseDate,
}: {
  releaseDate: string;
}) {
  const dateIsToday = dateStringIsToday(releaseDate);
  const textStyling = dateIsToday
    ? 'text-gray-900 px-2 py-1 bg-green-600 rounded-md'
    : 'text-gray-600 dark:text-gray-400';
  return (
    <span className={`flex justify-end text-sm font-bold ${textStyling}`}>
      {releaseDate}
    </span>
  );
}
