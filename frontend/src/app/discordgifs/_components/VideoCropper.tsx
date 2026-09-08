'use client';

import {
  ReactNode,
  PointerEvent,
  KeyboardEvent,
  useRef,
  useState,
  useId,
} from 'react';
import { ClipCrop } from '@/lib/types/discordgifs';
import {
  CropHandle,
  fullFrame,
  moveCrop,
  resizeCrop,
  squareCrop,
} from '@/lib/discordgifs/crop';

/** An overlay edits source coordinates without decoding or encoding extra frames. */
export default function VideoCropper({
  children,
  dimensions,
  crop,
  disabled,
  onChange,
  onEditingChange,
}: {
  children: ReactNode;
  dimensions: { width: number; height: number } | null;
  crop?: ClipCrop;
  disabled: boolean;
  onChange: (crop: ClipCrop | undefined) => void;
  onEditingChange: (editing: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [square, setSquare] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointer: number;
    x: number;
    y: number;
    width: number;
    height: number;
    crop: ClipCrop;
    handle: CropHandle | 'move';
  }>();
  const helpId = useId();
  const selection = crop ?? fullFrame;
  const aspect = dimensions ? dimensions.width / dimensions.height : 1;
  const edit = (value: boolean) => {
    setEditing(value);
    onEditingChange(value);
  };
  const update = (
    handle: CropHandle | 'move',
    original: ClipCrop,
    dx: number,
    dy: number
  ) => {
    onChange(
      handle === 'move'
        ? moveCrop(original, dx, dy)
        : resizeCrop(original, handle, dx, dy, aspect, square)
    );
  };
  const startDrag = (
    event: PointerEvent<HTMLButtonElement>,
    handle: CropHandle | 'move'
  ) => {
    if (disabled || !event.isPrimary || event.button !== 0) return;
    const rect = stage.current!.getBoundingClientRect();
    drag.current = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      width: rect.width,
      height: rect.height,
      crop: selection,
      handle,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.currentTarget.focus();
  };
  const keyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    handle: CropHandle | 'move'
  ) => {
    const direction = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[event.key];
    if (!direction) return;
    event.preventDefault();
    const step = event.shiftKey ? 0.05 : 0.01;
    update(handle, selection, direction[0] * step, direction[1] * step);
  };
  return (
    <div className='flex min-w-0 flex-col gap-3'>
      {dimensions && (
        <div className='flex flex-wrap items-center gap-2'>
          <button
            type='button'
            className='rounded border px-3 py-2'
            disabled={disabled}
            aria-pressed={editing}
            onClick={() => edit(!editing)}
          >
            {editing ? 'Done cropping' : 'Adjust crop'}
          </button>
          {editing && (
            <label className='flex items-center gap-2'>
              Shape
              <select
                aria-label='Crop shape'
                className='rounded border bg-secondary-dg px-2 py-2'
                disabled={disabled}
                value={square ? 'square' : 'freeform'}
                onChange={(event) => {
                  const nextSquare = event.target.value === 'square';
                  setSquare(nextSquare);
                  if (nextSquare) onChange(squareCrop(selection, aspect));
                }}
              >
                <option value='freeform'>Freeform</option>
                <option value='square'>Square</option>
              </select>
            </label>
          )}
          {crop && (
            <button
              type='button'
              className='rounded border px-3 py-2'
              disabled={disabled}
              onClick={() => {
                onChange(undefined);
                setSquare(false);
              }}
            >
              Reset crop
            </button>
          )}
        </div>
      )}
      <div
        ref={stage}
        className='relative mx-auto w-full overflow-hidden rounded-md bg-black'
        style={
          dimensions
            ? { aspectRatio: aspect, maxWidth: 256 * aspect }
            : undefined
        }
      >
        {children}
        {dimensions && (editing || crop) && (
          <div className='pointer-events-none absolute inset-0'>
            <div
              className='absolute border-2 border-white'
              style={{
                left: `${selection.x * 100}%`,
                top: `${selection.y * 100}%`,
                width: `${selection.width * 100}%`,
                height: `${selection.height * 100}%`,
                boxShadow: '0 0 0 9999px rgb(0 0 0 / 65%)',
              }}
            >
              {editing &&
                (['move', 'nw', 'ne', 'sw', 'se'] as const).map((handle) => (
                  <button
                    key={handle}
                    type='button'
                    disabled={disabled}
                    aria-label={
                      handle === 'move'
                        ? 'Move crop'
                        : `Resize crop ${{ nw: 'top left', ne: 'top right', sw: 'bottom left', se: 'bottom right' }[handle]}`
                    }
                    aria-describedby={helpId}
                    className={`pointer-events-auto absolute touch-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 ${handle === 'move' ? 'inset-0 cursor-move' : 'h-6 w-6 border-2 border-white bg-black/50'} ${handle === 'nw' ? 'left-0 top-0 cursor-nwse-resize' : handle === 'ne' ? 'right-0 top-0 cursor-nesw-resize' : handle === 'sw' ? 'bottom-0 left-0 cursor-nesw-resize' : handle === 'se' ? 'bottom-0 right-0 cursor-nwse-resize' : ''}`}
                    onPointerDown={(event) => startDrag(event, handle)}
                    onPointerMove={(event) => {
                      const active = drag.current;
                      if (
                        disabled ||
                        !active ||
                        active.pointer !== event.pointerId
                      )
                        return;
                      update(
                        active.handle,
                        active.crop,
                        (event.clientX - active.x) / active.width,
                        (event.clientY - active.y) / active.height
                      );
                    }}
                    onPointerUp={() => {
                      drag.current = undefined;
                    }}
                    onPointerCancel={() => {
                      drag.current = undefined;
                    }}
                    onLostPointerCapture={() => {
                      drag.current = undefined;
                    }}
                    onKeyDown={(event) => keyboard(event, handle)}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
      {editing && (
        <p id={helpId} className='text-xs'>
          Drag the box to move it, or drag a corner to resize. Keyboard: focus
          the box or a corner and use arrow keys. Hold Shift for larger steps.
        </p>
      )}
      {dimensions && (
        <p className='text-sm'>
          {crop
            ? `Crop: ${Math.round(crop.width * dimensions.width)} × ${Math.round(crop.height * dimensions.height)} px. Applies to all selected outputs.`
            : 'Using the full frame.'}
        </p>
      )}
    </div>
  );
}
