'use client';

import { ReactNode, useId, useState } from 'react';
import { LuRotateCcw, LuRotateCw } from 'react-icons/lu';
import { Switch } from '@/components/ui/switch';
import {
  AdvancedSettings,
  FileType,
  clampSetting,
  directionOptions,
  fileTypeInfo,
  fileTypeOrder,
  formatSpeed,
  gifDitherOptions,
  playsOptions,
  rotate,
  settingLimits,
  soundDropReason,
  speedSteps,
  widthChoices,
} from '@/lib/discordgifs/advanced';

const chip =
  'h-8 rounded-md px-2.5 text-sm text-foreground-dg/80 hover:bg-foreground-dg/10 hover:text-foreground-dg aria-pressed:bg-primary-dg aria-pressed:font-semibold aria-pressed:text-foreground-dg';
const field =
  'h-8 rounded-md border border-foreground-dg/25 bg-background-dg px-2 text-sm focus:border-primary-dg focus:outline-none';
const range = 'min-w-0 grow accent-primary-dg';
const button =
  'flex h-8 items-center gap-1.5 rounded-md border border-foreground-dg/25 px-2.5 text-sm hover:bg-foreground-dg/10 aria-pressed:border-primary-dg aria-pressed:bg-primary-dg/15 aria-pressed:font-semibold';

/** Gif Studio's settings column: Size, Timing, Edit, Quality & looping, Save as. */
export default function AdvancedSettingsForm({
  settings,
  onChange,
  outputWidth,
  nativeWidth,
  hasAudio,
}: {
  settings: AdvancedSettings;
  onChange: (settings: AdvancedSettings) => void;
  /** The width the file will have, after capping; null until the clip loads. */
  outputWidth: number | null;
  /** The crop's even width, the most the output can have. */
  nativeWidth: number | null;
  hasAudio: boolean | null;
}) {
  const update = (patch: Partial<AdvancedSettings>) =>
    onChange({ ...settings, ...patch });
  const fpsId = useId();
  const colorsId = useId();
  const ditherId = useId();
  const playsId = useId();
  const webpId = useId();
  const soundId = useId();
  const soundNoteId = useId();
  const widthId = useId();
  const speedId = useId();
  const topTextId = useId();
  const bottomTextId = useId();
  const captionSizeId = useId();
  const speedIndex = Math.max(
    0,
    speedSteps.findIndex((step) => step === settings.speed)
  );
  const soundDropped = soundDropReason(settings);
  const shownWidth =
    outputWidth ?? (settings.width === 'original' ? null : settings.width);
  const sliderMax = nativeWidth ?? 1280;

  const toggleFileType = (fileType: FileType, checked: boolean) =>
    update({
      fileTypes: fileTypeOrder.filter((type) =>
        type === fileType ? checked : settings.fileTypes.includes(type)
      ),
    });

  return (
    <div className='flex flex-col gap-4'>
      <Section title='Size'>
        <div className='flex items-center gap-2'>
          <label htmlFor={widthId} className='w-20 shrink-0 text-sm'>
            Width
          </label>
          <input
            id={widthId}
            type='range'
            className={range}
            min={Math.min(120, sliderMax)}
            max={sliderMax}
            step={2}
            value={shownWidth ?? sliderMax}
            onChange={(event) =>
              update({ width: Number(event.target.value) })
            }
          />
          <WidthField
            value={shownWidth}
            max={nativeWidth ?? settingLimits.width.max}
            onCommit={(width) => update({ width })}
          />
        </div>
        <div className='flex flex-wrap gap-1' role='group' aria-label='Width presets'>
          {widthChoices.map((width) => (
            <button
              key={width}
              type='button'
              className={chip}
              aria-pressed={settings.width === width}
              onClick={() => update({ width })}
            >
              {width}
            </button>
          ))}
          <button
            type='button'
            className={chip}
            aria-pressed={settings.width === 'original'}
            onClick={() => update({ width: 'original' })}
          >
            Original
          </button>
        </div>
      </Section>

      <Section title='Timing'>
        <div className='flex items-center gap-2'>
          <label htmlFor={fpsId} className='w-20 shrink-0 text-sm'>
            Frame rate
          </label>
          <input
            id={fpsId}
            type='range'
            className={range}
            min={settingLimits.fps.min}
            max={settingLimits.fps.max}
            step={1}
            value={settings.fps}
            onChange={(event) =>
              update({ fps: clampSetting('fps', Number(event.target.value)) })
            }
          />
          <span className='w-14 shrink-0 text-right text-sm tabular-nums'>
            {settings.fps} fps
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <label htmlFor={speedId} className='w-20 shrink-0 text-sm'>
            Speed
          </label>
          <input
            id={speedId}
            type='range'
            className={range}
            min={0}
            max={speedSteps.length - 1}
            step={1}
            value={speedIndex}
            aria-valuetext={formatSpeed(settings.speed)}
            onChange={(event) =>
              update({ speed: speedSteps[Number(event.target.value)] })
            }
          />
          <span className='w-14 shrink-0 text-right text-sm tabular-nums'>
            {formatSpeed(settings.speed)}
          </span>
        </div>
        <div
          role='group'
          aria-label='Direction'
          className='grid grid-cols-3 gap-0.5 rounded-lg border border-foreground-dg/25 bg-background-dg p-0.5'
        >
          {directionOptions.map(({ value, label }) => (
            <button
              key={value}
              type='button'
              className='h-7 rounded-md text-sm text-foreground-dg/70 hover:text-foreground-dg aria-pressed:bg-foreground-dg/15 aria-pressed:font-semibold aria-pressed:text-foreground-dg'
              aria-pressed={settings.direction === value}
              onClick={() => update({ direction: value })}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title='Edit'>
        <div className='flex flex-wrap items-center gap-1.5'>
          <button
            type='button'
            className={button}
            aria-label='Rotate left'
            title='Rotate left'
            onClick={() => update({ rotation: rotate(settings.rotation, 'left') })}
          >
            <LuRotateCcw aria-hidden className='h-4 w-4' />
            Left
          </button>
          <button
            type='button'
            className={button}
            aria-label='Rotate right'
            title='Rotate right'
            onClick={() =>
              update({ rotation: rotate(settings.rotation, 'right') })
            }
          >
            <LuRotateCw aria-hidden className='h-4 w-4' />
            Right
          </button>
          <button
            type='button'
            className={button}
            aria-pressed={settings.flipHorizontal}
            title='Mirror left to right'
            onClick={() =>
              update({ flipHorizontal: !settings.flipHorizontal })
            }
          >
            Flip ↔
          </button>
          <button
            type='button'
            className={button}
            aria-pressed={settings.flipVertical}
            title='Flip upside down'
            onClick={() => update({ flipVertical: !settings.flipVertical })}
          >
            Flip ↕
          </button>
          {settings.rotation !== 0 && (
            <span className='text-sm tabular-nums text-foreground-dg/70'>
              Turned {settings.rotation}°
            </span>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <label htmlFor={topTextId} className='w-20 shrink-0 text-sm'>
            Top text
          </label>
          <input
            id={topTextId}
            type='text'
            className={`${field} min-w-0 grow`}
            placeholder='Caption above'
            value={settings.topText}
            onChange={(event) => update({ topText: event.target.value })}
          />
        </div>
        <div className='flex items-center gap-2'>
          <label htmlFor={bottomTextId} className='w-20 shrink-0 text-sm'>
            Bottom text
          </label>
          <input
            id={bottomTextId}
            type='text'
            className={`${field} min-w-0 grow`}
            placeholder='Caption below'
            value={settings.bottomText}
            onChange={(event) => update({ bottomText: event.target.value })}
          />
        </div>
        <div className='flex items-center gap-2'>
          <label htmlFor={captionSizeId} className='w-20 shrink-0 text-sm'>
            Text size
          </label>
          <input
            id={captionSizeId}
            type='range'
            className={range}
            min={settingLimits.captionSize.min}
            max={settingLimits.captionSize.max}
            step={1}
            value={settings.captionSize}
            aria-valuetext={`${settings.captionSize}% of the shorter side`}
            onChange={(event) =>
              update({
                captionSize: clampSetting(
                  'captionSize',
                  Number(event.target.value)
                ),
              })
            }
          />
          <span className='w-14 shrink-0 text-right text-sm tabular-nums'>
            {settings.captionSize}%
          </span>
        </div>
      </Section>

      <details className='group flex flex-col gap-2'>
        <summary className='cursor-pointer text-sm font-semibold'>
          Quality &amp; looping
        </summary>
        <div className='mt-2 flex flex-col gap-3'>
          <div className='flex items-center gap-2'>
            <label htmlFor={colorsId} className='w-20 shrink-0 text-sm'>
              GIF colours
            </label>
            <input
              id={colorsId}
              type='range'
              className={range}
              min={settingLimits.gifColors.min}
              max={settingLimits.gifColors.max}
              step={1}
              value={settings.gifColors}
              onChange={(event) =>
                update({
                  gifColors: clampSetting(
                    'gifColors',
                    Number(event.target.value)
                  ),
                })
              }
            />
            <span className='w-14 shrink-0 text-right text-sm tabular-nums'>
              {settings.gifColors}
            </span>
          </div>
          <p className='-mt-2 text-xs text-foreground-dg/60'>
            Fewer colours make a smaller GIF; 64 to 128 is often plenty.
          </p>
          <div className='flex items-center gap-2'>
            <label htmlFor={ditherId} className='w-20 shrink-0 text-sm'>
              Dithering
            </label>
            <select
              id={ditherId}
              className={`${field} min-w-0 grow`}
              value={settings.gifDither}
              onChange={(event) =>
                update({
                  gifDither: event.target.value as AdvancedSettings['gifDither'],
                })
              }
            >
              {gifDitherOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className='flex items-center gap-2'>
            <label htmlFor={playsId} className='w-20 shrink-0 text-sm'>
              Loop
            </label>
            <select
              id={playsId}
              className={`${field} min-w-0 grow`}
              value={settings.plays}
              onChange={(event) =>
                update({ plays: Number(event.target.value) })
              }
            >
              {playsOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className='flex items-center gap-2'>
            <label htmlFor={webpId} className='w-20 shrink-0 text-sm'>
              WebP quality
            </label>
            <input
              id={webpId}
              type='range'
              className={range}
              min={settingLimits.webpQuality.min}
              max={settingLimits.webpQuality.max}
              step={1}
              value={settings.webpQuality}
              onChange={(event) =>
                update({
                  webpQuality: clampSetting(
                    'webpQuality',
                    Number(event.target.value)
                  ),
                })
              }
            />
            <span className='w-14 shrink-0 text-right text-sm tabular-nums'>
              {settings.webpQuality}
            </span>
          </div>
          {/* Hidden only when the browser is sure there is no sound; when it
              can't tell, the optional audio map makes the switch harmless. */}
          {hasAudio !== false && (
            <div className='flex flex-col gap-1'>
              <span className='flex items-center gap-2 text-sm'>
                <Switch
                  id={soundId}
                  checked={settings.keepSound}
                  onCheckedChange={(keepSound) => update({ keepSound })}
                  aria-describedby={
                    settings.keepSound && soundDropped ? soundNoteId : undefined
                  }
                  className='data-[state=checked]:bg-primary-dg data-[state=unchecked]:bg-foreground-dg/20'
                />
                <label htmlFor={soundId} className='cursor-pointer'>
                  Keep sound in MP4
                </label>
              </span>
              {settings.keepSound && soundDropped && (
                <p id={soundNoteId} className='text-xs text-amber-200'>
                  {soundDropped}
                </p>
              )}
            </div>
          )}
        </div>
      </details>

      <Section title='Save as'>
        <div className='grid grid-cols-3 gap-2'>
          {fileTypeOrder.map((fileType) => (
            <label
              key={fileType}
              className='flex cursor-pointer flex-col gap-0.5 rounded-md border border-foreground-dg/25 p-2 has-[:checked]:border-primary-dg has-[:checked]:bg-primary-dg/15'
            >
              <span className='flex items-center gap-1.5 text-sm font-semibold'>
                <input
                  type='checkbox'
                  className='accent-primary-dg'
                  checked={settings.fileTypes.includes(fileType)}
                  onChange={(event) =>
                    toggleFileType(fileType, event.target.checked)
                  }
                />
                {fileTypeInfo[fileType].label}
              </span>
              <small className='text-xs text-foreground-dg/60'>
                {fileTypeInfo[fileType].note}
              </small>
            </label>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className='flex flex-col gap-2'>
      <h3 className='text-sm font-semibold'>{title}</h3>
      {children}
    </section>
  );
}

/** Holds a draft while typing so a half-typed width is never clamped. */
function WidthField({
  value,
  max,
  onCommit,
}: {
  value: number | null;
  max: number;
  onCommit: (width: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const parsed = Number(draft);
    setDraft(null);
    if (draft.trim() !== '' && Number.isFinite(parsed))
      onCommit(Math.min(max, clampSetting('width', parsed)));
  };
  return (
    <input
      type='number'
      aria-label='Width in pixels'
      className={`${field} w-20 shrink-0 tabular-nums`}
      min={settingLimits.width.min}
      max={max}
      step={2}
      value={draft ?? value ?? ''}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') commit();
        if (event.key === 'Escape') setDraft(null);
      }}
    />
  );
}
