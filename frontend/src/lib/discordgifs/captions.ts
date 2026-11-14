import { Anton } from 'next/font/google';
import type { AdvancedSettings } from './advanced';
import type { Size } from './output-preview';

/**
 * Impact can't be bundled, so Anton (OFL) stands in as the bold display face.
 * Not preloaded: only Advanced mode's captions use it, and they load it on
 * demand before drawing.
 */
const anton = Anton({
  weight: '400',
  subsets: ['latin', 'latin-ext'],
  preload: false,
});

/** Advanced mode's meme-style captions, as the settings hold them. */
export type Captions = Pick<
  AdvancedSettings,
  'topText' | 'bottomText' | 'captionSize'
>;

export type CaptionPosition = 'top' | 'bottom';

/** Share of the output's width a line may fill before it shrinks. */
const fitShare = 0.94;
/** Gif Studio's floor, in output pixels, so a long line stays legible. */
const minimumPixels = 8;

/**
 * Gif Studio switches a whole line to a CJK-capable system font as soon as it
 * holds anything beyond Latin and general punctuation (Korean, emoji), so a
 * mixed line never pairs Anton with a thinner fallback.
 */
const latinOnly = /^[\x00-ɏ -⁯]*$/;

/**
 * System faces only: no bundled font covers Hangul, CJK and colour emoji at a
 * reasonable size. Emoji faces come after the CJK ones so digits and
 * punctuation stay in the text face.
 */
const systemStack =
  '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans CJK KR", "Noto Sans KR", "Hiragino Sans", "PingFang SC", "Microsoft YaHei", "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

/** The canvas font for a caption line at `pixels`. */
export function captionFont(text: string, pixels: number): string {
  return latinOnly.test(text)
    ? `${pixels}px ${anton.style.fontFamily}, ${systemStack}`
    : `bold ${pixels}px ${systemStack}`;
}

/** The lines to draw, trimmed; blank ones draw nothing. */
export function captionLines(
  captions: Captions
): Array<{ position: CaptionPosition; text: string }> {
  const lines: Array<{ position: CaptionPosition; text: string }> = [];
  const top = captions.topText.trim();
  const bottom = captions.bottomText.trim();
  if (top) lines.push({ position: 'top', text: top });
  if (bottom) lines.push({ position: 'bottom', text: bottom });
  return lines;
}

export function hasCaptions(captions: Captions): boolean {
  return captionLines(captions).length > 0;
}

/** The chosen size in output pixels, before any line shrinks to fit. */
export function captionBasePixels(output: Size, sizePercent: number): number {
  return Math.max(
    minimumPixels,
    Math.round((Math.min(output.width, output.height) * sizePercent) / 100)
  );
}

/**
 * Gif Studio's fit (`capPx`): the line measured at the chosen size, plus a
 * sixth of that size for the outline, must fit in 94% of the output's width;
 * a wider line shrinks in proportion, never below 8 px.
 */
export function fitCaptionPixels(
  textWidth: number,
  basePixels: number,
  outputWidth: number
): number {
  const width = textWidth + basePixels / 6;
  const room = outputWidth * fitShare;
  return Math.max(
    minimumPixels,
    width > room ? Math.floor((basePixels * room) / width) : basePixels
  );
}

/**
 * Draws the captions over whatever `context` holds. Sizes are fitted in
 * output pixels and then scaled to `canvas`, so the preview (a scaled-down
 * canvas) and the overlay image (a canvas at the output size) place and size
 * every line the same way. Outline and margin follow Gif Studio's `drawtext`:
 * a border of px/12 each side and a margin of 0.3 × px.
 */
export function drawCaptions(
  context: CanvasRenderingContext2D,
  captions: Captions,
  output: Size,
  canvas: Size
) {
  const lines = captionLines(captions);
  if (lines.length === 0) return;
  const scale = canvas.width / output.width;
  const base = captionBasePixels(output, captions.captionSize);
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.textAlign = 'center';
  context.lineJoin = 'round';
  context.strokeStyle = '#000';
  context.fillStyle = '#fff';
  for (const { position, text } of lines) {
    context.font = captionFont(text, base);
    const pixels = fitCaptionPixels(
      context.measureText(text).width,
      base,
      output.width
    );
    const margin = Math.round(pixels * 0.3) * scale;
    context.font = captionFont(text, pixels * scale);
    context.lineWidth = Math.max(1, Math.round(pixels / 12)) * 2 * scale;
    context.textBaseline = position;
    const y = position === 'top' ? margin : canvas.height - margin;
    context.strokeText(text, canvas.width / 2, y);
    context.fillText(text, canvas.width / 2, y);
  }
  context.restore();
}

/**
 * Whether every face the captions use is ready. Measuring with a face still
 * loading would fit the line to the fallback's widths. Without the Font
 * Loading API there is nothing to wait for.
 */
export function captionFontsLoaded(captions: Captions): boolean {
  if (typeof document === 'undefined' || !document.fonts) return true;
  return captionLines(captions).every(({ text }) =>
    document.fonts.check(captionFont(text, 40), text)
  );
}

/**
 * Loads the faces the captions need. Anton is split by unicode range, so the
 * load names the text to fetch every subset it touches. A face that fails to
 * load is logged rather than thrown: the system fallback still draws the
 * caption, which beats failing the conversion.
 */
export async function loadCaptionFonts(captions: Captions): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await Promise.all(
      captionLines(captions).map(({ text }) =>
        document.fonts.load(captionFont(text, 40), text)
      )
    );
  } catch (error) {
    console.error('Caption font failed to load', error);
  }
}

/**
 * The captions as a transparent PNG at the exact output size, for FFmpeg to
 * overlay on every frame, or null when there is nothing to draw.
 */
export async function renderCaptionImage(
  captions: Captions,
  output: Size
): Promise<Uint8Array | null> {
  if (!hasCaptions(captions)) return null;
  await loadCaptionFonts(captions);
  const canvas = document.createElement('canvas');
  canvas.width = output.width;
  canvas.height = output.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable');
  drawCaptions(context, captions, output, output);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png')
  );
  if (!blob) throw new Error('Could not encode the captions');
  return new Uint8Array(await blob.arrayBuffer());
}
