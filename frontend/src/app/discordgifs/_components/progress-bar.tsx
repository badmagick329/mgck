import { SizeInfo } from '@/lib/ffmpeg-utils/frame-size-calculator';
import { FFmpegConversionState } from '@/lib/types';

const ballSize = 16;
const barWidth = 200;
const scale = 1.1;
const maxXPos = (barWidth - ballSize) / scale;

export default function ProgressBar({
  target,
  current,
  iterationProgress,
  conversionState,
}: {
  target?: SizeInfo;
  current: number;
  iterationProgress: number;
  conversionState: FFmpegConversionState;
}) {
  if (!target) {
    return null;
  }
  const targetSize = target.sizeLimit;
  const lower = targetSize - targetSize * 1.25;
  const upper = targetSize + targetSize * 1.25;
  current = current === 0 ? lower : current;
  const xPos = calcXPos(current, targetSize, lower, upper, maxXPos);
  const lowerBound = getLowerBound(target.sizeLimit, target.sizeMargin);

  return (
    <div className='flex flex-col items-center gap-2'>
      <StatusText conversionState={conversionState} />
      <div
        style={{ width: `${barWidth}px` }}
        className='relative h-4 rounded-sm bg-gradient-to-b from-gray-600 via-gray-400/60 to-gray-600'
      >
        <VerticalBar
          size={target.sizeLimit}
          lower={lower}
          upper={upper}
          totalWidth={barWidth}
          shadowColor={'green'}
          twColor={'bg-green-500/50'}
          conversionState={conversionState}
        />
        <VerticalBar
          size={lowerBound}
          lower={lower}
          upper={upper}
          totalWidth={barWidth}
          shadowColor={'green'}
          twColor={'bg-green-500/50'}
          conversionState={conversionState}
        />
        <Ball xPos={xPos} conversionState={conversionState} />
        <IterationProgress progress={iterationProgress} />
      </div>
    </div>
  );
}

function StatusText({
  conversionState,
}: {
  conversionState: FFmpegConversionState;
}) {
  if (conversionState === 'idle') {
    return <p className='text-sm'>Ready</p>;
  } else if (conversionState === 'busy') {
    return <p className='text-sm'>...</p>;
  } else if (conversionState === 'optimizing') {
    return <p className='text-sm'>Optimizing input...</p>;
  } else if (conversionState === 'done') {
    return (
      <p
        style={{
          animation: 'bounce 1s ease-in-out 0s 1 normal forwards',
        }}
        className='text-sm'
      >
        Done
      </p>
    );
  } else if (conversionState === 'converting') {
    return <p className='text-sm'>Adjusting size...</p>;
  }
}

function VerticalBar({
  size,
  lower,
  upper,
  totalWidth,
  shadowColor,
  twColor,
  conversionState,
}: {
  size: number;
  lower: number;
  upper: number;
  totalWidth: number;
  shadowColor: string;
  twColor: string;
  conversionState: FFmpegConversionState;
}) {
  if (conversionState === 'done') {
    return null;
  }
  const posInPerc = calcLeftOffset(upper, lower, totalWidth, size);
  const w = 6;
  return (
    <div
      style={{
        boxShadow: `0px 0px 2px ${shadowColor}, 0 0 2px ${shadowColor} inset`,
        left: `calc(${posInPerc}% - ${Math.round(w / 2)}px)`,
        width: `${w}px`,
        zIndex: 2,
      }}
      className={`absolute h-4 ${twColor}`}
    ></div>
  );
}

function Ball({
  xPos,
  conversionState,
}: {
  xPos: number;
  conversionState: FFmpegConversionState;
}) {
  const borderColor =
    conversionState === 'done' ? 'border-green-500' : 'border-orange-500';
  const shadowColor = conversionState === 'done' ? 'green' : 'orange';
  return (
    <div
      style={{
        transition: 'all 0.5s',
        boxShadow: `0px 0px 8px ${shadowColor}, 0 0 4px ${shadowColor} inset`,
        scale,
        transform: `translateX(${xPos}px)`,
        width: `${ballSize}px`,
        height: `${ballSize}px`,
        zIndex: 1,
      }}
      className={`absolute h-4 w-4 rounded-full border-2 ${borderColor} bg-[#0e0e0e]`}
    ></div>
  );
}

function calcXPos(
  current: number,
  targetSize: number,
  lower: number,
  upper: number,
  maxPx: number
) {
  const range = upper - lower;
  const targetPercent = (targetSize - lower) / range;
  const currentPercent = (current - lower) / range;
  let percent = currentPercent / targetPercent;
  percent = Math.min(2, Math.max(0, percent));
  return (percent * maxPx) / 2;
}

function getLowerBound(size: number, margin: number) {
  return size * (1 - margin);
}

function calcLeftOffset(
  upper: number,
  lower: number,
  totalWidth: number,
  size: number
) {
  const bytesPerPx = (upper - lower) / totalWidth;
  const sizeOffset = size - lower;
  const posInPx = sizeOffset / bytesPerPx;
  const posInPerc = (posInPx / totalWidth) * 100;
  return posInPerc;
}

function IterationProgress({ progress }: { progress: number }) {
  // NOTE: FFmpeg.wasm progress is broken right now. Waiting for the fix
  return null;

  return (
    <div
      style={{
        width: `${progress * 100}%`,
      }}
      className='absolute h-4 bg-blue-300'
    ></div>
  );
}
