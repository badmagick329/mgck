import { ClipCrop } from '@/lib/types/discordgifs';

export type CropHandle = 'nw' | 'ne' | 'sw' | 'se';
export const fullFrame: ClipCrop = { x: 0, y: 0, width: 1, height: 1 };
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function moveCrop(crop: ClipCrop, dx: number, dy: number): ClipCrop {
  return {
    ...crop,
    x: clamp(crop.x + dx, 0, 1 - crop.width),
    y: clamp(crop.y + dy, 0, 1 - crop.height),
  };
}

/** Normalized square dimensions differ on a non-square source frame. */
export function squareCrop(crop: ClipCrop, aspect: number): ClipCrop {
  const width = Math.min(crop.width, crop.height / aspect);
  const height = width * aspect;
  return {
    x: crop.x + (crop.width - width) / 2,
    y: crop.y + (crop.height - height) / 2,
    width,
    height,
  };
}

/** Anchor the opposite corner so constrained resizing never leaves the source frame. */
export function resizeCrop(
  crop: ClipCrop,
  handle: CropHandle,
  dx: number,
  dy: number,
  aspect: number,
  square: boolean
): ClipCrop {
  const left = handle.includes('w');
  const top = handle.includes('n');
  const anchorX = left ? crop.x + crop.width : crop.x;
  const anchorY = top ? crop.y + crop.height : crop.y;
  const maxWidth = left ? anchorX : 1 - anchorX;
  const maxHeight = top ? anchorY : 1 - anchorY;
  let width = crop.width + (left ? -dx : dx);
  let height = crop.height + (top ? -dy : dy);
  if (square) {
    // Use the dominant physical movement, including for vertical keyboard resizing.
    if (Math.abs(dy) > Math.abs(dx * aspect)) width = height / aspect;
    const minimum = Math.min(0.05, 0.05 / aspect);
    width = clamp(width, minimum, Math.min(maxWidth, maxHeight / aspect));
    height = width * aspect;
  } else {
    width = clamp(width, Math.min(0.05, maxWidth), maxWidth);
    height = clamp(height, Math.min(0.05, maxHeight), maxHeight);
  }
  return {
    x: left ? anchorX - width : anchorX,
    y: top ? anchorY - height : anchorY,
    width,
    height,
  };
}
