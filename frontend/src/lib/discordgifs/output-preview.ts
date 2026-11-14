import { ClipCrop } from '@/lib/types/discordgifs';
import {
  ConversionPresetId,
  conversionTargetPresets,
} from './conversion-target';
import { Rotation, orientedSize } from './advanced';
import { Captions, drawCaptions } from './captions';

export type Size = { width: number; height: number };
export type SourceRect = Size & { x: number; y: number };

/**
 * How a host app fits an image into a square box: Discord contains emoji and
 * stickers and crops avatars to fill a circle.
 */
export type PreviewFit = 'contain' | 'cover';

/**
 * Source pixels the conversion keeps. The FFmpeg crop filter takes the same
 * fractions of the frame (`ffmpeg-commands.ts`), so both frame it alike.
 */
export function cropSourceRect(
  crop: ClipCrop | undefined,
  frame: Size
): SourceRect {
  const fraction = crop ?? { x: 0, y: 0, width: 1, height: 1 };
  return {
    x: fraction.x * frame.width,
    y: fraction.y * frame.height,
    width: Math.max(1, fraction.width * frame.width),
    height: Math.max(1, fraction.height * frame.height),
  };
}

/**
 * The scale search starts at the preset's width and only shrinks it to fit
 * the size cap, so the width is an upper bound, never a promise.
 */
export function approximateWidthLabel(presetId: ConversionPresetId): string {
  return `≈ ${conversionTargetPresets[presetId].startingWidth} px wide`;
}

/**
 * Where `source` lands in a square `box`: contain shrinks the drawing to the
 * source's aspect, cover keeps the box and takes the centred part of the
 * source that fills it.
 */
export function fitToBox(
  source: SourceRect,
  box: number,
  fit: PreviewFit
): { source: SourceRect; display: Size } {
  const aspect = source.width / source.height;
  if (fit === 'contain') {
    return {
      source,
      display:
        aspect >= 1
          ? { width: box, height: Math.max(1, Math.round(box / aspect)) }
          : { width: Math.max(1, Math.round(box * aspect)), height: box },
    };
  }
  const side = Math.min(source.width, source.height);
  return {
    source: {
      x: source.x + (source.width - side) / 2,
      y: source.y + (source.height - side) / 2,
      width: side,
      height: side,
    },
    display: { width: box, height: box },
  };
}

/**
 * Canvas pixels for a drawing shown at `display` CSS pixels. Sharp on dense
 * screens, but never sharper than the output itself, so a preview Discord
 * enlarges (a 140 px sticker in a 160 px box) looks as soft as the real file.
 */
export function canvasResolution(
  display: Size,
  shownSource: SourceRect,
  crop: SourceRect,
  outputWidth: number,
  pixelRatio: number
): Size {
  const outputPixels = (shownSource.width * outputWidth) / crop.width;
  const scale = Math.min(pixelRatio, outputPixels / display.width);
  return {
    width: Math.max(1, Math.round(display.width * scale)),
    height: Math.max(1, Math.round(display.height * scale)),
  };
}

/** Advanced mode's rotate and flip, applied in FFmpeg's order: turn, then flip. */
export type Orientation = {
  rotation: Rotation;
  flipHorizontal: boolean;
  flipVertical: boolean;
};

export const upright: Orientation = {
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
};

/** Exact sines and cosines, so a quarter turn never leaves a sub-pixel skew. */
const turns: Record<Rotation, { cos: number; sin: number }> = {
  0: { cos: 1, sin: 0 },
  90: { cos: 0, sin: 1 },
  180: { cos: -1, sin: 0 },
  270: { cos: 0, sin: -1 },
};

/** Captions and the output size they are fitted to. */
export type CaptionLayer = { captions: Captions; output: Size };

/**
 * One output frame. Every preview draws through here. Captions go on last,
 * outside the turn, as FFmpeg overlays them after the scale so they stay
 * upright; the overlay image comes from the same `drawCaptions`.
 *
 * The source is drawn unturned into a box the size of the canvas before the
 * turn, and the transform turns it clockwise and then mirrors it about the
 * canvas centre: the same result as `transpose`, then `hflip`/`vflip`.
 */
export function drawOutputFrame(
  context: CanvasRenderingContext2D,
  video: CanvasImageSource,
  source: SourceRect,
  canvas: Size,
  orientation: Orientation = upright,
  captions?: CaptionLayer
) {
  const { cos, sin } = turns[orientation.rotation];
  const flipX = orientation.flipHorizontal ? -1 : 1;
  const flipY = orientation.flipVertical ? -1 : 1;
  const unturned = orientedSize(canvas, orientation.rotation);
  // Canvas point = flip · rotate · (point − unturned centre) + canvas centre.
  const a = flipX * cos;
  const b = flipY * sin;
  const c = -flipX * sin;
  const d = flipY * cos;
  const e = canvas.width / 2 - (a * unturned.width + c * unturned.height) / 2;
  const f = canvas.height / 2 - (b * unturned.width + d * unturned.height) / 2;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingQuality = 'high';
  context.setTransform(a, b, c, d, e, f);
  context.drawImage(
    video,
    source.x,
    source.y,
    source.width,
    source.height,
    0,
    0,
    unturned.width,
    unturned.height
  );
  context.setTransform(1, 0, 0, 1, 0, 0);
  if (captions)
    drawCaptions(context, captions.captions, captions.output, canvas);
}
