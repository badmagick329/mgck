import { useSearchParams } from 'next/navigation';

export default function useFeatureFlag() {
  const params = useSearchParams();

  const getBooleanFlag = (flag: 'debug' | 'sync') => Boolean(params.get(flag));

  return {
    getBooleanFlag,
  };
}
