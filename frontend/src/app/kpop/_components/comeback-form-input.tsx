import { Input } from '@/components/ui/input';

export default function ComebackFormInput({
  name,
  placeholder,
  defaultValue,
  onChange,
}: {
  name: string;
  placeholder: string;
  defaultValue: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Input
      name={name}
      placeholder={placeholder}
      autoComplete='off'
      type='search'
      defaultValue={defaultValue}
      onChange={onChange}
    />
  );
}
