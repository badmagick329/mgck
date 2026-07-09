import { Input } from '@/components/ui/input';

export default function ComebackFormInput({
  name,
  placeholder,
  defaultValue,
  disabled = false,
}: {
  name: string;
  placeholder: string;
  defaultValue: string;
  disabled?: boolean;
}) {
  return (
    <Input
      className='border-primary-kp/50 border-2'
      name={name}
      placeholder={placeholder}
      autoComplete='off'
      type='search'
      defaultValue={defaultValue}
      disabled={disabled}
    />
  );
}
