export default function ComebackCardContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex max-w-[400px] flex-col items-center gap-4 rounded-md border-2 bg-background-light p-4'>
      {children}
    </div>
  );
}
