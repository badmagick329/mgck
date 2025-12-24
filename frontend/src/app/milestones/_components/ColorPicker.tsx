import { ChangeEvent } from 'react';

export default function ColorPicker({
  color,
  handleColorChange,
}: {
  color: string;
  handleColorChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <>
      <div className='relative'>
        <input
          type='color'
          value={color}
          onChange={handleColorChange}
          className='absolute inset-0 h-8 w-8 cursor-pointer rounded-md border border-foreground opacity-0'
        />
        <div
          className='h-8 w-8 rounded-md shadow-md'
          style={{ backgroundColor: color }}
        />
      </div>
      <span className='text-sm font-medium'>Pick Color</span>
    </>
  );
}
