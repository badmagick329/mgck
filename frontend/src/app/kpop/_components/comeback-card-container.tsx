export default function ComebackCardContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='bg-primary-kp/30 flex max-w-[400px] flex-col items-center gap-4 rounded-md border-2 p-4'>
      {children}
    </div>
  );
}
