'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { ClipCrop } from '@/lib/types/discordgifs';
import {
  Orientation,
  PreviewFit,
  Size,
  SourceRect,
  canvasResolution,
  cropSourceRect,
  drawOutputFrame,
  fitToBox,
  upright,
} from '@/lib/discordgifs/output-preview';
import { isSideways } from '@/lib/discordgifs/advanced';

/** A source rectangle as it reads after a quarter turn. */
const turned = (rect: SourceRect, sideways: boolean): SourceRect =>
  sideways ? { ...rect, width: rect.height, height: rect.width } : rect;

/**
 * Draws the cropped selection from the editor's own video on every presented
 * frame, so it loops whatever the editor plays without decoding the clip twice
 * or touching FFmpeg.
 */
export default function OutputPreview({
  video,
  crop,
  box,
  fit,
  outputWidth,
  orientation = upright,
  label,
  className,
}: {
  video: HTMLVideoElement | null;
  crop?: ClipCrop;
  /** Advanced mode's rotate and flips; the presets stay upright. */
  orientation?: Orientation;
  /** Side of the square CSS box the output is shown in. */
  box: number;
  fit: PreviewFit;
  /** Output width in pixels, which caps the drawing's sharpness. */
  outputWidth: number;
  label: string;
  className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [display, setDisplay] = useState<Size | null>(null);
  const draw = useRef(() => {});
  // Primitives, so a caller's fresh object each render doesn't redraw.
  const { rotation, flipHorizontal, flipVertical } = orientation;
  useEffect(() => {
    draw.current = () => {
      const element = canvas.current;
      // Before the first decoded frame there is nothing to draw, and drawing
      // would leave an empty canvas sized for a frame that doesn't exist yet.
      if (!video || !element || video.readyState < 2 || !video.videoWidth)
        return;
      const kept = cropSourceRect(crop, {
        width: video.videoWidth,
        height: video.videoHeight,
      });
      // The box and sharpness follow the turned output, while drawing reads
      // the unturned source; a centred square is the same either way.
      const sideways = isSideways(rotation);
      const { source } = fitToBox(kept, box, fit);
      const shown = fitToBox(turned(kept, sideways), box, fit).display;
      const resolution = canvasResolution(
        shown,
        turned(source, sideways),
        turned(kept, sideways),
        outputWidth,
        window.devicePixelRatio || 1
      );
      if (element.width !== resolution.width) element.width = resolution.width;
      if (element.height !== resolution.height)
        element.height = resolution.height;
      setDisplay((current) =>
        current?.width === shown.width && current.height === shown.height
          ? current
          : shown
      );
      const context = element.getContext('2d');
      if (context)
        drawOutputFrame(context, video, source, resolution, {
          rotation,
          flipHorizontal,
          flipVertical,
        });
    };
    draw.current();
  }, [
    video,
    crop,
    box,
    fit,
    outputWidth,
    rotation,
    flipHorizontal,
    flipVertical,
  ]);

  useEffect(() => {
    if (!video) return;
    const redraw = () => draw.current();
    video.addEventListener('loadeddata', redraw);
    video.addEventListener('seeked', redraw);
    let frame = 0;
    let handle: number | undefined;
    if ('requestVideoFrameCallback' in video) {
      // Fires once per presented frame, during playback and after a seek,
      // and not at all while paused.
      handle = video.requestVideoFrameCallback(function onFrame() {
        redraw();
        handle = video.requestVideoFrameCallback(onFrame);
      });
    } else {
      // Older browsers without frame callbacks; the DOM types assume them.
      const media: HTMLMediaElement = video;
      frame = requestAnimationFrame(function tick() {
        if (!media.paused) redraw();
        frame = requestAnimationFrame(tick);
      });
    }
    return () => {
      video.removeEventListener('loadeddata', redraw);
      video.removeEventListener('seeked', redraw);
      if (handle !== undefined) video.cancelVideoFrameCallback(handle);
      cancelAnimationFrame(frame);
    };
  }, [video]);

  return (
    <canvas
      ref={canvas}
      role='img'
      aria-label={label}
      className={clsx(!display && 'invisible', className)}
      style={display ?? { width: box, height: box }}
    />
  );
}
