type CriterionProps = {
  label: string;
  weight?: number;
  maxValue?: number;
};

export default function Criterion({ weight, maxValue, label }: CriterionProps) {
  weight = weight ?? 1;
  maxValue = maxValue ?? 4;
  return (
    <div className='flex gap-4'>
      <span>Weight: {weight}</span>
      <span>maxValue: {maxValue}</span>
      <span>{label}</span>
    </div>
  );
}
