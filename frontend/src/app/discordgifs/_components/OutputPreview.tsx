'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { ClipCrop } from '@/lib/types/discordgifs';
import {
  PreviewFit,
  Size,
  canvasResolution,
  cropSourceRect,
  drawOutputFrame,
  fitToBox,
} from '@/lib/discordgifs/output-preview';

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
  label,
  className,
}: {
  video: HTMLVideoElement | null;
  crop?: ClipCrop;
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
      const fitted = fitToBox(kept, box, fit);
      const resolution = canvasResolution(
        fitted.display,
        fitted.source,
        kept,
        outputWidth,
        window.devicePixelRatio || 1
      );
      if (element.width !== resolution.width) element.width = resolution.width;
      if (element.height !== resolution.height)
        element.height = resolution.height;
      setDisplay((current) =>
        current?.width === fitted.display.width &&
        current.height === fitted.display.height
          ? current
          : fitted.display
      );
      const context = element.getContext('2d');
      if (context) drawOutputFrame(context, video, fitted.source, resolution);
    };
    draw.current();
  }, [video, crop, box, fit, outputWidth]);

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
