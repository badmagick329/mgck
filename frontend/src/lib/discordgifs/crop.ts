import { ClipCrop } from '@/lib/types/discordgifs';

export type CropHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
export const fullFrame: ClipCrop = { x: 0, y: 0, width: 1, height: 1 };

/** Ratios are output width over height in pixels, which is what users pick by. */
export const cropRatios = [
  { label: '1:1', ratio: 1 },
  { label: '4:5', ratio: 4 / 5 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '9:16', ratio: 9 / 16 },
] as const;

/** Smallest side as a fraction of the frame, so a box stays grabbable. */
const minimumSide = 0.05;
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/**
 * Crops are fractions of the frame, so a pixel ratio becomes a different
 * fraction ratio on a non-square frame: height = width * this.
 */
const heightPerWidth = (ratio: number, aspect: number) => aspect / ratio;

export function moveCrop(crop: ClipCrop, dx: number, dy: number): ClipCrop {
  return {
    ...crop,
    x: clamp(crop.x + dx, 0, 1 - crop.width),
    y: clamp(crop.y + dy, 0, 1 - crop.height),
  };
}

/** The largest box of `ratio` inside `crop`, centred on it. */
export function fitRatio(
  crop: ClipCrop,
  ratio: number,
  aspect: number
): ClipCrop {
  const k = heightPerWidth(ratio, aspect);
  const width = Math.min(crop.width, crop.height / k);
  const height = width * k;
  return {
    x: crop.x + (crop.width - width) / 2,
    y: crop.y + (crop.height - height) / 2,
    width,
    height,
  };
}

/**
 * A dragged side moves while the opposite side stays anchored, so resizing
 * never leaves the frame. With a ratio, an edge handle drives one axis and the
 * other grows around the box's centre, shifting back inside the frame when it
 * would cross an edge.
 */
export function resizeCrop(
  crop: ClipCrop,
  handle: CropHandle,
  dx: number,
  dy: number,
  aspect: number,
  ratio: number | null
): ClipCrop {
  const left = handle.includes('w');
  const right = handle.includes('e');
  const top = handle.includes('n');
  const bottom = handle.includes('s');
  const anchorX = left ? crop.x + crop.width : crop.x;
  const anchorY = top ? crop.y + crop.height : crop.y;
  const maxWidth = left ? anchorX : right ? 1 - anchorX : 1;
  const maxHeight = top ? anchorY : bottom ? 1 - anchorY : 1;
  let width = crop.width + (left ? -dx : right ? dx : 0);
  let height = crop.height + (top ? -dy : bottom ? dy : 0);
  if (ratio !== null) {
    const k = heightPerWidth(ratio, aspect);
    // A corner follows the larger on-screen movement, so a vertical arrow key
    // resizes a corner as well as a horizontal one.
    const followHeight =
      !(left || right) ||
      ((top || bottom) && Math.abs(dy) > Math.abs(dx * aspect));
    if (followHeight) width = height / k;
    const upper = Math.min(maxWidth, maxHeight / k);
    width = clamp(
      width,
      Math.min(Math.max(minimumSide, minimumSide / k), upper),
      upper
    );
    height = width * k;
  } else {
    if (left || right)
      width = clamp(width, Math.min(minimumSide, maxWidth), maxWidth);
    if (top || bottom)
      height = clamp(height, Math.min(minimumSide, maxHeight), maxHeight);
  }
  return {
    x: left
      ? anchorX - width
      : right
        ? anchorX
        : clamp(crop.x + (crop.width - width) / 2, 0, 1 - width),
    y: top
      ? anchorY - height
      : bottom
        ? anchorY
        : clamp(crop.y + (crop.height - height) / 2, 0, 1 - height),
    width,
    height,
  };
}

/** Pixel size of a crop, rounded the way the readouts show it. */
export function cropPixels(
  crop: ClipCrop,
  dimensions: { width: number; height: number }
) {
  return {
    width: Math.round(crop.width * dimensions.width),
    height: Math.round(crop.height * dimensions.height),
  };
}

/** A box covering every source pixel is no crop, so nothing extra is stored or encoded. */
export function isFullFrame(
  crop: ClipCrop,
  dimensions: { width: number; height: number }
) {
  const size = cropPixels(crop, dimensions);
  return (
    size.width === dimensions.width &&
    size.height === dimensions.height &&
    Math.round(crop.x * dimensions.width) === 0 &&
    Math.round(crop.y * dimensions.height) === 0
  );
}
