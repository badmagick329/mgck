import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import VideoCropper from '@/app/discordgifs/_components/VideoCropper';
import { ClipCrop } from '@/lib/types/discordgifs';
import {
  fullFrame,
  moveCrop,
  resizeCrop,
  squareCrop,
} from '@/lib/discordgifs/crop';

function Harness({ disabled = false }: { disabled?: boolean }) {
  const [crop, setCrop] = useState<ClipCrop>();
  return (
    <VideoCropper
      dimensions={{ width: 640, height: 360 }}
      crop={crop}
      disabled={disabled}
      onChange={setCrop}
      onEditingChange={() => {}}
    >
      <video />
    </VideoCropper>
  );
}

test.each([16 / 9, 9 / 16])(
  'square crop remains square and bounded for aspect %s',
  (aspect) => {
    const square = squareCrop(fullFrame, aspect);
    expect(square.width * aspect).toBeCloseTo(square.height);
    for (const handle of ['nw', 'ne', 'sw', 'se'] as const) {
      for (const delta of [-10, -0.2, 0.2, 10]) {
        const resized = resizeCrop(square, handle, delta, delta, aspect, true);
        expect(resized.width * aspect).toBeCloseTo(resized.height);
        expect(resized.x).toBeGreaterThanOrEqual(-1e-10);
        expect(resized.y).toBeGreaterThanOrEqual(-1e-10);
        expect(resized.x + resized.width).toBeLessThanOrEqual(1 + 1e-10);
        expect(resized.y + resized.height).toBeLessThanOrEqual(1 + 1e-10);
        expect(resized.width).toBeGreaterThan(0);
      }
    }
  }
);

test('moving stops at frame edges and freeform resizing anchors the opposite corner', () => {
  const crop = { x: 0.2, y: 0.3, width: 0.4, height: 0.5 };
  expect(moveCrop(crop, 10, -10)).toEqual({ ...crop, x: 0.6, y: 0 });
  const resized = resizeCrop(crop, 'nw', -0.1, 0.1, 16 / 9, false);
  expect(resized.x).toBeCloseTo(0.1);
  expect(resized.y).toBeCloseTo(0.4);
  expect(resized.x + resized.width).toBeCloseTo(0.6);
  expect(resized.y + resized.height).toBeCloseTo(0.8);
});

test('square, keyboard resize, saved crop and reset are available without conversion', () => {
  render(<Harness />);
  expect(screen.getByText('Using the full frame.')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Adjust crop'));
  fireEvent.change(screen.getByLabelText('Crop shape'), {
    target: { value: 'square' },
  });
  expect(screen.getByText(/Crop: 360 × 360 px/)).toBeInTheDocument();
  fireEvent.keyDown(screen.getByLabelText('Resize crop bottom right'), {
    key: 'ArrowLeft',
    shiftKey: true,
  });
  expect(screen.getByText(/Crop: 328 × 328 px/)).toBeInTheDocument();
  fireEvent.keyDown(screen.getByLabelText('Move crop'), { key: 'ArrowRight' });
  fireEvent.click(screen.getByText('Done cropping'));
  expect(screen.queryByLabelText('Move crop')).not.toBeInTheDocument();
  expect(screen.getByText(/Crop: 328 × 328 px/)).toBeInTheDocument();
  fireEvent.click(screen.getByText('Reset crop'));
  expect(screen.getByText('Using the full frame.')).toBeInTheDocument();
});

test('crop controls lock during conversion', () => {
  const { rerender } = render(<Harness />);
  fireEvent.click(screen.getByText('Adjust crop'));
  rerender(<Harness disabled />);
  expect(screen.getByLabelText('Move crop')).toBeDisabled();
  expect(screen.getByLabelText('Crop shape')).toBeDisabled();
});
