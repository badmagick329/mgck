import { CalculatedResults } from '@/hooks/use-choices-state';

type ChoicesOutputProps = {
  calculatedResults: CalculatedResults;
};

export default function ChoicesOutput({
  calculatedResults,
}: ChoicesOutputProps) {
  return (
    <div className='flex flex-col gap-2'>
      {calculatedResults().map((result) => {
        return (
          <div
            key={result.choice}
            className='flex flex-col border-2 border-white px-2 py-1'
          >
            <span>{result.choice}</span>
            <span>{result.score.toFixed(2)}</span>
          </div>
        );
      })}
    </div>
  );
}
