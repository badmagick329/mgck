import { ChangeEvent } from 'react';

export default function ColorPicker({
  color,
  handleColorChange,
}: {
  color: string;
  handleColorChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    // <div className='flex items-center justify-center gap-4'>
    <>
      <div className='relative'>
        <input
          type='color'
          value={color}
          onChange={handleColorChange}
          className='absolute inset-0 h-8 w-8 cursor-pointer rounded-lg border border-foreground opacity-0'
        />
        <div
          className='h-8 w-8 rounded-lg shadow-md'
          style={{ backgroundColor: color }}
        />
      </div>
      <div className='flex flex-col'>
        <label className='text-sm font-medium'>Color</label>
        <span className='text-xs'>{color}</span>
      </div>
    </>
  );
}
