import useScrollIndicator from '@/hooks/use-scroll-indicator';

export default function ScrollIndicator({
  colorValue,
}: {
  colorValue: string;
}) {
  const scrollPercentage = useScrollIndicator();

  return (
    <div className='fixed left-0 top-0 h-1 w-full'>
      <div
        className='h-full'
        style={{
          width: `${scrollPercentage}%`,
          backgroundColor: colorValue,
        }}
      />
    </div>
  );
}
