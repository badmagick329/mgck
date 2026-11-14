import { ClipTrim } from '@/lib/types/discordgifs';

/**
 * Browsers expose no frame rate, so frame steps and the shortest selection
 * assume 30 fps until playback measures the clip's real frame interval.
 */
export const defaultFrameSeconds = 1 / 30;

/** Formats seconds as `m:ss.cc`, the form the typed Start and End fields accept. */
export function formatClipTime(seconds: number): string {
  const centiseconds = Math.round(Math.max(0, seconds) * 100);
  const minutes = Math.floor(centiseconds / 6000);
  const rest = (centiseconds % 6000) / 100;
  return `${minutes}:${rest < 10 ? '0' : ''}${rest.toFixed(2)}`;
}

/** Accepts `m:ss.cc`, `h:mm:ss` or plain seconds; returns null for anything else. */
export function parseClipTime(text: string): number | null {
  const parts = text.trim().split(':');
  if (
    parts.length > 3 ||
    parts.some((part) => !/^\d+(\.\d*)?$|^\.\d+$/.test(part))
  )
    return null;
  return parts.reduce((total, part) => total * 60 + Number(part), 0);
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

type Selection = { start: number; end: number };

/** One frame, or the whole clip when the clip is shorter than a frame. */
export function shortestSelection(total: number, frameSeconds: number) {
  return Math.min(frameSeconds, total);
}

export function setSelectionStart(
  selection: Selection,
  start: number,
  total: number,
  frameSeconds: number
): Selection {
  const shortest = shortestSelection(total, frameSeconds);
  return {
    start: clamp(start, 0, Math.max(0, selection.end - shortest)),
    end: selection.end,
  };
}

export function setSelectionEnd(
  selection: Selection,
  end: number,
  total: number,
  frameSeconds: number
): Selection {
  const shortest = shortestSelection(total, frameSeconds);
  return {
    start: selection.start,
    end: clamp(end, Math.min(total, selection.start + shortest), total),
  };
}

/** Moves the span as a whole, keeping its length and stopping at the clip edges. */
export function moveSelection(
  selection: Selection,
  delta: number,
  total: number
): Selection {
  const length = selection.end - selection.start;
  const start = clamp(selection.start + delta, 0, total - length);
  return { start, end: start + length };
}

/**
 * A selection covering the whole clip is stored as no trim, so conversion
 * skips the seek and duration arguments exactly as it did before any edit.
 */
export function toClipTrim(
  selection: Selection,
  total: number
): ClipTrim | undefined {
  return selection.start <= 0 && selection.end >= total
    ? undefined
    : { start: selection.start, end: selection.end };
}
