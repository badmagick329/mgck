import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import VideoCropper from '@/app/discordgifs/_components/VideoCropper';
import { ClipCrop } from '@/lib/types/discordgifs';
import {
  CropHandle,
  cropRatios,
  fitRatio,
  fullFrame,
  moveCrop,
  resizeCrop,
} from '@/lib/discordgifs/crop';

const frames = [
  { width: 1280, height: 720 },
  { width: 720, height: 1280 },
];
const handles: CropHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const epsilon = 1e-9;

function expectInsideFrame(crop: ClipCrop) {
  expect(crop.x).toBeGreaterThanOrEqual(-epsilon);
  expect(crop.y).toBeGreaterThanOrEqual(-epsilon);
  expect(crop.x + crop.width).toBeLessThanOrEqual(1 + epsilon);
  expect(crop.y + crop.height).toBeLessThanOrEqual(1 + epsilon);
  expect(crop.width).toBeGreaterThan(0);
  expect(crop.height).toBeGreaterThan(0);
}

const pixelRatio = (crop: ClipCrop, frame: { width: number; height: number }) =>
  (crop.width * frame.width) / (crop.height * frame.height);

describe.each(frames)('on a $width × $height frame', (frame) => {
  const aspect = frame.width / frame.height;

  test.each(cropRatios)(
    '$label fits the largest box of that ratio in the current crop',
    ({ ratio }) => {
      const fitted = fitRatio(fullFrame, ratio, aspect);
      expect(pixelRatio(fitted, frame)).toBeCloseTo(ratio);
      expectInsideFrame(fitted);
      // Largest: it spans the whole frame along at least one axis.
      expect(Math.max(fitted.width, fitted.height)).toBeCloseTo(1);

      const current = { x: 0.1, y: 0.2, width: 0.5, height: 0.6 };
      const inside = fitRatio(current, ratio, aspect);
      expect(pixelRatio(inside, frame)).toBeCloseTo(ratio);
      expect(inside.x).toBeGreaterThanOrEqual(current.x - epsilon);
      expect(inside.y).toBeGreaterThanOrEqual(current.y - epsilon);
      expect(inside.x + inside.width).toBeLessThanOrEqual(
        current.x + current.width + epsilon
      );
      expect(inside.y + inside.height).toBeLessThanOrEqual(
        current.y + current.height + epsilon
      );
      expect(
        inside.width === current.width || inside.height === current.height
      ).toBe(true);
    }
  );

  test.each(cropRatios)(
    '$label stays locked and inside the frame when resized from any handle',
    ({ ratio }) => {
      const start = fitRatio(
        { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
        ratio,
        aspect
      );
      for (const handle of handles) {
        for (const [dx, dy] of [
          [-10, -10],
          [-0.1, 0.05],
          [0.1, -0.05],
          [0, 0.1],
          [0.1, 0],
          [10, 10],
        ]) {
          const resized = resizeCrop(start, handle, dx, dy, aspect, ratio);
          expect(pixelRatio(resized, frame)).toBeCloseTo(ratio);
          expectInsideFrame(resized);
          // The side opposite a dragged side stays put.
          if (handle.includes('e')) expect(resized.x).toBeCloseTo(start.x);
          if (handle.includes('s')) expect(resized.y).toBeCloseTo(start.y);
          if (handle.includes('w'))
            expect(resized.x + resized.width).toBeCloseTo(
              start.x + start.width
            );
          if (handle.includes('n'))
            expect(resized.y + resized.height).toBeCloseTo(
              start.y + start.height
            );
        }
      }
    }
  );
});

test('a locked edge drag grows the other axis around the centre and stops at the frame', () => {
  const aspect = 16 / 9;
  const square = fitRatio(
    { x: 0.1, y: 0.4, width: 0.2, height: 0.2 },
    1,
    aspect
  );
  const wider = resizeCrop(square, 'e', 0.05, 0, aspect, 1);
  expect(wider.width).toBeCloseTo(square.width + 0.05);
  expect(wider.y + wider.height / 2).toBeCloseTo(square.y + square.height / 2);
  // A dragged bottom edge stops at the bottom of the frame.
  const tallest = resizeCrop(square, 's', 0, 10, aspect, 1);
  expect(tallest.y + tallest.height).toBeCloseTo(1);
  expect(tallest.width * aspect).toBeCloseTo(tallest.height);
  // Square on a 16:9 frame is limited by the frame's height: the box grows to
  // full height and shifts up to stay inside.
  const widest = resizeCrop(square, 'e', 10, 0, aspect, 1);
  expect(widest.height).toBeCloseTo(1);
  expect(widest.y).toBeCloseTo(0);
  expect(widest.x).toBeCloseTo(square.x);
  // Near the right edge, the frame's width limits it first.
  const nearRight = moveCrop(square, 0.5, 0);
  const capped = resizeCrop(nearRight, 'e', 10, 0, aspect, 1);
  expect(capped.x + capped.width).toBeCloseTo(1);
  expect(capped.height).toBeLessThan(1);
});

test('free resizing moves only the dragged sides and clamps at frame edges', () => {
  const crop = { x: 0.2, y: 0.3, width: 0.4, height: 0.5 };
  expect(moveCrop(crop, 10, -10)).toEqual({ ...crop, x: 0.6, y: 0 });
  const resized = resizeCrop(crop, 'nw', -0.1, 0.1, 16 / 9, null);
  expect(resized.x).toBeCloseTo(0.1);
  expect(resized.y).toBeCloseTo(0.4);
  expect(resized.x + resized.width).toBeCloseTo(0.6);
  expect(resized.y + resized.height).toBeCloseTo(0.8);
  expect(resizeCrop(crop, 'e', 0.1, 0.3, 16 / 9, null)).toEqual({
    ...crop,
    width: 0.5,
  });
  expect(resizeCrop(crop, 'n', 0.3, -10, 16 / 9, null)).toEqual({
    ...crop,
    y: 0,
    height: 0.8,
  });
  const smallest = resizeCrop(crop, 'se', -10, -10, 16 / 9, null);
  expect(smallest).toEqual({ ...crop, width: 0.05, height: 0.05 });
});

function Harness({ disabled = false }: { disabled?: boolean }) {
  const [crop, setCrop] = useState<ClipCrop>();
  return (
    <VideoCropper
      dimensions={{ width: 640, height: 360 }}
      crop={crop}
      disabled={disabled}
      onChange={setCrop}
    >
      <video />
    </VideoCropper>
  );
}

const ratioButton = (label: string) =>
  screen.getByRole('button', { name: label });

test('the crop box is on the frame from the start, with no edit mode', () => {
  render(<Harness />);
  expect(
    screen.getByText('Full frame. Drag a corner to crop.')
  ).toBeInTheDocument();
  expect(screen.getByText('640 × 360')).toBeInTheDocument();
  expect(screen.getByLabelText('Move crop')).toBeEnabled();
  for (const corner of ['top left', 'top right', 'bottom left', 'bottom right'])
    expect(screen.getByLabelText(`Resize crop ${corner}`)).toBeEnabled();
  for (const edge of ['top', 'right', 'bottom', 'left'])
    expect(screen.getByLabelText(`Resize crop ${edge}`)).toBeEnabled();
  expect(ratioButton('Free')).toHaveAttribute('aria-pressed', 'true');
  expect(ratioButton('Reset crop')).toBeDisabled();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
});

test('aspect buttons fit their ratio inside the current box and lock resizing', () => {
  render(<Harness />);
  fireEvent.click(ratioButton('1:1'));
  expect(ratioButton('1:1')).toHaveAttribute('aria-pressed', 'true');
  expect(ratioButton('Free')).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByText('Crop 360 × 360 px')).toBeInTheDocument();
  expect(screen.getByText('360 × 360')).toBeInTheDocument();

  fireEvent.keyDown(screen.getByLabelText('Resize crop bottom right'), {
    key: 'ArrowLeft',
    shiftKey: true,
  });
  expect(screen.getByText('Crop 328 × 328 px')).toBeInTheDocument();
  fireEvent.keyDown(screen.getByLabelText('Resize crop right'), {
    key: 'ArrowRight',
  });
  expect(screen.getByText('Crop 334 × 334 px')).toBeInTheDocument();

  // A ratio fits inside the current box rather than the whole frame.
  fireEvent.click(ratioButton('4:5'));
  expect(screen.getByText('Crop 268 × 334 px')).toBeInTheDocument();
  fireEvent.click(ratioButton('16:9'));
  expect(screen.getByText('Crop 268 × 150 px')).toBeInTheDocument();

  // Free keeps the box and unlocks single-axis resizing.
  fireEvent.click(ratioButton('Free'));
  expect(screen.getByText('Crop 268 × 150 px')).toBeInTheDocument();
  fireEvent.keyDown(screen.getByLabelText('Resize crop bottom right'), {
    key: 'ArrowDown',
    shiftKey: true,
  });
  expect(screen.getByText('Crop 268 × 168 px')).toBeInTheDocument();
});

test('reset returns to the full frame, or the largest box of a locked ratio', () => {
  render(<Harness />);
  fireEvent.click(ratioButton('9:16'));
  expect(screen.getByText('Crop 203 × 360 px')).toBeInTheDocument();
  fireEvent.keyDown(screen.getByLabelText('Resize crop top left'), {
    key: 'ArrowRight',
    shiftKey: true,
  });
  fireEvent.keyDown(screen.getByLabelText('Move crop'), { key: 'ArrowLeft' });
  expect(screen.queryByText('Crop 203 × 360 px')).not.toBeInTheDocument();
  fireEvent.click(ratioButton('Reset crop'));
  expect(screen.getByText('Crop 203 × 360 px')).toBeInTheDocument();
  expect(ratioButton('9:16')).toHaveAttribute('aria-pressed', 'true');

  fireEvent.click(ratioButton('Free'));
  fireEvent.click(ratioButton('Reset crop'));
  expect(
    screen.getByText('Full frame. Drag a corner to crop.')
  ).toBeInTheDocument();
  expect(ratioButton('Reset crop')).toBeDisabled();
});

test('crop controls lock during conversion', () => {
  const { rerender } = render(<Harness />);
  fireEvent.click(ratioButton('1:1'));
  rerender(<Harness disabled />);
  expect(screen.getByLabelText('Move crop')).toBeDisabled();
  expect(screen.getByLabelText('Resize crop top')).toBeDisabled();
  for (const label of [
    'Free',
    '1:1',
    '4:5',
    '4:3',
    '16:9',
    '9:16',
    'Reset crop',
  ])
    expect(ratioButton(label)).toBeDisabled();
});
