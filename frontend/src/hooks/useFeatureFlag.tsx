import { useSearchParams } from 'next/navigation';

export default function useFeatureFlag() {
  const params = useSearchParams();

  const getBooleanFlag = (flag: 'debug' | 'milestoneServerSync') =>
    Boolean(params.get(flag));

  return {
    getBooleanFlag,
  };
}
