import Choices from './_components/choices';
import Criteria from './_components/criteria';

export default function ChoosePage() {
  return (
    <div className='flex flex-col items-center gap-2 pt-4'>
      <Criteria />
      <Choices />
    </div>
  );
}
