'use client';

import {
  FileAction,
  FilesState,
  durationState,
  filesStateReducer,
} from '@/lib/discordgifs/files-state';
import {
  AdvancedSettings,
  defaultAdvancedSettings,
} from '@/lib/discordgifs/advanced';
import { EditorClip, SessionResult } from '@/lib/types/discordgifs';
import AdvancedEditor from './AdvancedEditor';
import ModeSwitch, { ConverterMode } from './ModeSwitch';
import {
  ConversionPresetId,
  defaultConversionPresetSelection,
} from '@/lib/discordgifs/conversion-target';
import { hasEligibleIdleFile } from '@/lib/discordgifs/eligibility';
import { readFileDuration } from '@/lib/discordgifs/file-duration';
import clsx from 'clsx';
import { useCallback, useEffect, useReducer, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import ConvertedFile from './ConvertedFile';
import DiscordUploadHelp from './DiscordUploadHelp';
import PresetSelector from './PresetSelector';
import { convert } from '@/lib/discordgifs';
import {
  acceptedImageTypes,
  acceptedTypes,
  acceptedVideoTypes,
  maxFiles,
} from '@/lib/consts/discordgifs';
import { useFFmpeg } from '@/hooks/discordgifs/useFFmpeg';
import { useFilePaste } from '@/hooks/discordgifs/useFilePaste';
import { useClipShortcuts } from '@/hooks/discordgifs/useClipShortcuts';

export default function FileDropzone() {
  const { ffmpegRef, isLoaded } = useFFmpeg();
  const [filesState, dispatch] = useReducer(filesStateReducer, {});
  const [dropError, setDropError] = useState<string | null>(null);
  const [dragEnter, setDragEnter] = useState<boolean>(false);
  const [conversionInProgress, setConversionInProgress] = useState(false);
  const [selectedOutputTypes, setSelectedOutputTypes] = useState<
    ConversionPresetId[]
  >([...defaultConversionPresetSelection]);
  const [mode, setMode] = useState<ConverterMode>('simple');
  const [advancedClip, setAdvancedClip] = useState<EditorClip | null>(null);
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>(
    defaultAdvancedSettings
  );
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const [advancedBusy, setAdvancedBusy] = useState(false);
  const advanced = mode === 'advanced';

  // Read after hydration, so the server-rendered page stays the canonical
  // simple mode and the link only changes what the visitor starts in.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get(modeParam) === 'advanced') setMode('advanced');
  }, []);

  const checkFileDuration = useCallback((file: File) => {
    void readFileDuration(file).then((seconds) => {
      dispatch({
        type: 'updateDuration',
        payload: { name: file.name, file, seconds },
      });
      setAdvancedClip((clip) =>
        clip?.file === file
          ? { ...clip, duration: durationState(seconds) }
          : clip
      );
    });
  }, []);

  const openAdvancedClip = useCallback(
    (file: File) => {
      setAdvancedClip({ file, duration: { status: 'checking' } });
      checkFileDuration(file);
    },
    [checkFileDuration]
  );

  // The card the user last focused or pressed, falling back to the newest one,
  // so shortcuts never reach a card the user isn't working on.
  const [chosenClip, setChosenClip] = useState<string | null>(null);
  const clipNames = Object.keys(filesState);
  const activeClip =
    chosenClip !== null && chosenClip in filesState
      ? chosenClip
      : clipNames[clipNames.length - 1];

  const {
    acceptedFiles,
    getRootProps,
    getInputProps,
    fileRejections,
    open,
    rootRef,
  } = useDropzone({
    accept: acceptedTypes,
    onDragEnter: (e) => {
      setDragEnter(true);
    },
    onDragLeave: (e) => {
      setDragEnter(false);
    },
    onDropAccepted: (files) => {
      setDragEnter(false);
      setDropError(null);
      // Choosing files leaves focus on the dropzone, where Space would
      // reopen the picker instead of playing the clip that just arrived.
      const focused = document.activeElement;
      if (focused instanceof HTMLElement && rootRef.current?.contains(focused))
        focused.blur();
    },
    onDropRejected: (fileRejections) => {
      setDragEnter(false);
      for (const rejection of fileRejections) {
        for (const err of rejection.errors) {
          if (err.code === 'too-many-files') {
            setDropError(
              advanced
                ? 'Advanced mode converts one clip at a time. Drop a single file.'
                : `You can only upload up to ${maxFiles} files`
            );
            return;
          }
        }
      }
    },
    maxFiles: advanced ? 1 : maxFiles,
    multiple: !advanced,
    // A replacement clip mid-conversion would orphan the running job.
    disabled: advanced && advancedBusy,
  });

  const totalFiles = Object.values(filesState).reduce(
    (count, file) => count + (file.conversionState === 'idle' ? 1 : 0),
    0
  );

  useEffect(() => {
    if (acceptedFiles.length === 0) return;

    if (advanced) {
      openAdvancedClip(acceptedFiles[0]);
      setDropError(null);
      return;
    }

    if (totalFiles + 1 > maxFiles) {
      setDropError(`You can only upload up to ${maxFiles} files.`);
      return;
    }

    for (let i = 0; i < acceptedFiles.length; i++) {
      if (totalFiles + i + 1 > maxFiles) {
        break;
      }
      const file = acceptedFiles[i];
      dispatch({
        type: 'addFile',
        payload: { file, outputTypes: selectedOutputTypes },
      });
      checkFileDuration(file);
      setChosenClip(file.name);
    }
    setDropError(null);
  }, [acceptedFiles]);

  const onFilesPasted = useCallback(
    (fileItems: File[]) => {
      if (advanced) {
        if (advancedBusy) return;
        openAdvancedClip(fileItems[0]);
        setDropError(null);
        return;
      }
      if (totalFiles + 1 > maxFiles) {
        setDropError(`You can only upload up to ${maxFiles} files.`);
        return;
      }
      const newFiles = [];
      for (let i = 0; i < fileItems.length; i++) {
        if (totalFiles + i + 1 > maxFiles) {
          break;
        }
        newFiles.push(fileItems[i]);
      }
      dispatch({
        type: 'addFiles',
        payload: { files: newFiles, outputTypes: selectedOutputTypes },
      });
      for (const file of newFiles) checkFileDuration(file);
      if (newFiles.length > 0)
        setChosenClip(newFiles[newFiles.length - 1].name);

      setDropError(null);
    },
    [
      advanced,
      advancedBusy,
      openAdvancedClip,
      checkFileDuration,
      selectedOutputTypes,
      totalFiles,
    ]
  );

  useFilePaste(onFilesPasted);
  useClipShortcuts({ openFile: open }, {});

  const anyProcessing = Object.values(filesState).some((d) =>
    ['busy', 'optimizing', 'converting'].includes(d.conversionState)
  );

  const hasEligibleOutput = hasEligibleIdleFile(filesState);

  const buttonEnabled =
    !conversionInProgress &&
    !anyProcessing &&
    totalFiles > 0 &&
    hasEligibleOutput;

  const selectorDisabled = conversionInProgress || anyProcessing;

  const startConversion = (files: FilesState) => {
    setConversionInProgress(true);
    void convert(ffmpegRef, files, dispatch)
      .catch((error) => console.error('Conversion error:', error))
      .finally(() => setConversionInProgress(false));
  };

  /**
   * The clip being worked on follows the switch, trim and crop included:
   * simple mode's active card becomes Advanced mode's clip, and Advanced
   * mode's clip joins the simple cards when there is room for it.
   */
  const switchMode = (next: ConverterMode) => {
    if (next === mode) return;
    if (next === 'advanced') {
      const source = activeClip ? filesState[activeClip] : undefined;
      if (source && source.file !== advancedClip?.file)
        setAdvancedClip({
          file: source.file,
          duration: source.duration,
          trim: source.trim,
          crop: source.crop,
        });
    } else if (advancedClip) {
      const { file, trim, crop, duration } = advancedClip;
      const existing = filesState[file.name];
      const canUpdate =
        existing?.file === file && existing.conversionState === 'idle';
      const canAdd = !existing && totalFiles < maxFiles;
      if (canAdd) {
        dispatch({
          type: 'addFile',
          payload: { file, outputTypes: selectedOutputTypes },
        });
        if (duration.status !== 'checking')
          dispatch({
            type: 'updateDuration',
            payload: {
              name: file.name,
              file,
              seconds: duration.status === 'known' ? duration.seconds : null,
            },
          });
      }
      if (canAdd || canUpdate) {
        dispatch({ type: 'updateTrim', payload: { name: file.name, trim } });
        dispatch({ type: 'updateCrop', payload: { name: file.name, crop } });
        setChosenClip(file.name);
      }
    }
    setMode(next);
    setDropError(null);
    const url = new URL(window.location.href);
    if (next === 'advanced') url.searchParams.set(modeParam, 'advanced');
    else url.searchParams.delete(modeParam);
    window.history.replaceState(null, '', url);
  };

  if (isLoaded === false) {
    return (
      <div className='flex w-full flex-col items-center gap-8 px-2 pt-16'>
        <p className='text-xl font-semibold'>
          An error occurred loading ffmpeg.
        </p>
      </div>
    );
  }

  return (
    <div className='flex w-full grow flex-col items-center gap-5 px-2'>
      <ModeSwitch
        mode={mode}
        disabled={selectorDisabled || advancedBusy}
        onChange={switchMode}
      />
      {!advanced && (
        <PresetSelector
          selectedPresetIds={selectedOutputTypes}
          disabled={selectorDisabled}
          onChange={(presetIds) => {
            setSelectedOutputTypes(presetIds);
            dispatch({
              type: 'updateIdleOutputTypes',
              payload: { outputTypes: presetIds },
            });
          }}
        />
      )}
      {advanced && (
        <p className='max-w-2xl text-center text-sm text-foreground-dg/80'>
          Convert one clip to GIF, WebP or MP4 with your own width, frame rate
          and quality. Nothing is sized for Discord&apos;s limits.
        </p>
      )}
      <div
        {...getRootProps({ className: 'dropzone' })}
        className={clsx(
          'flex flex-col items-center gap-4 bg-secondary-dg',
          'rounded-md px-6 py-8 hover:cursor-pointer',
          `shadow-glow-secondary-dg ${dragEnter && 'scale-110'}`,
          `transition-all`
        )}
      >
        <input {...getInputProps()} />
        <p>
          {advanced
            ? 'Drop a video or GIF here, or click to choose one.'
            : 'Drop a video or GIF here, or click to choose files.'}
        </p>
        <p>
          You can also paste {advanced ? 'a file' : 'files'} from your
          clipboard.
        </p>
        <p className='pb-4'>
          Supported formats:{' '}
          <span className='font-semibold'>
            {acceptedImageTypes.join(', ')}, {acceptedVideoTypes.join(', ')}
          </span>
        </p>
        {advanced ? (
          <p className='text-xs'>
            {advancedClip
              ? 'Opening another clip replaces this one.'
              : 'Advanced mode converts one clip at a time.'}
          </p>
        ) : (
          <MoreFilesText totalFiles={totalFiles} maxFiles={maxFiles} />
        )}
      </div>
      {!advanced && (
        <button
          className={clsx(
            `${buttonEnabled && 'hover:bg-primary-dg/80'}`,
            `${!buttonEnabled ? 'bg-secondary-dg' : 'bg-primary-dg'}`,
            `rounded-md border-2 border-orange-500`,
            `px-4 py-2 disabled:border-orange-500/60 disabled:text-foreground-dg/60`,
            `shadow-glow-primary-dg ${
              !buttonEnabled && dragEnter && 'animate-pulse'
            }`
          )}
          onClick={() => startConversion(filesState)}
          disabled={!buttonEnabled}
        >
          Convert All
        </button>
      )}
      {dropError && <p className='font-semibold text-red-500'>{dropError}</p>}
      {advanced ? (
        <AdvancedEditor
          // A new clip starts with fresh media and conversion state.
          key={advancedClip ? fileKey(advancedClip.file) : 'empty'}
          clip={advancedClip}
          settings={advancedSettings}
          results={sessionResults}
          ffmpegRef={ffmpegRef}
          onSettingsChange={setAdvancedSettings}
          onTrimChange={(trim) =>
            setAdvancedClip((clip) => clip && { ...clip, trim })
          }
          onCropChange={(crop) =>
            setAdvancedClip((clip) => clip && { ...clip, crop })
          }
          onRemove={() => {
            setAdvancedClip(null);
            setDropError(null);
          }}
          onResult={(result) =>
            setSessionResults((results) => [result, ...results])
          }
          onBusyChange={setAdvancedBusy}
        />
      ) : (
        <>
          <ConvertedFiles
            filesState={filesState}
            activeClip={activeClip}
            onActivate={setChosenClip}
            dispatch={dispatch}
            disabled={selectorDisabled}
            onConvert={(name) => startConversion({ [name]: filesState[name] })}
            setDropError={setDropError}
          />
          <DiscordUploadHelp />
        </>
      )}
    </div>
  );
}

const modeParam = 'mode';

/** Files carry no identity, so a key comes from a per-object counter. */
const fileKeys = new WeakMap<File, string>();
let nextFileKey = 0;
function fileKey(file: File): string {
  let key = fileKeys.get(file);
  if (!key) {
    key = `clip-${++nextFileKey}`;
    fileKeys.set(file, key);
  }
  return key;
}

function MoreFilesText({
  totalFiles,
  maxFiles,
}: {
  totalFiles: number;
  maxFiles: number;
}) {
  if (totalFiles === 0) {
    return (
      <p className='text-xs'>You can add up to {maxFiles} files at a time.</p>
    );
  }

  if (totalFiles >= maxFiles) {
    return <p className='text-xs'>You cannot add more files.</p>;
  }

  return (
    <p className='text-xs'>You can add {maxFiles - totalFiles} more file(s).</p>
  );
}

function ConvertedFiles({
  filesState,
  activeClip,
  onActivate,
  dispatch,
  setDropError,
  disabled,
  onConvert,
}: {
  disabled: boolean;
  onConvert: (name: string) => void;
  filesState: FilesState;
  activeClip: string | undefined;
  onActivate: (name: string) => void;
  dispatch: (value: FileAction) => void;
  setDropError: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  return (
    <div className='mt-8 flex flex-wrap justify-center gap-8 px-4 text-center'>
      {Object.keys(filesState).length > 0 &&
        Object.entries(filesState).map(([name, data]) => (
          <ConvertedFile
            key={name}
            active={name === activeClip}
            showActive={Object.keys(filesState).length > 1}
            onActivate={() => onActivate(name)}
            disabled={disabled}
            onConvert={() => onConvert(name)}
            onCropChange={(crop) =>
              dispatch({ type: 'updateCrop', payload: { name, crop } })
            }
            onTrimChange={(trim) =>
              dispatch({ type: 'updateTrim', payload: { name, trim } })
            }
            fileData={data}
            removeFile={() => {
              dispatch({
                type: 'removeFile',
                payload: { name },
              });

              setDropError(null);
            }}
          />
        ))}
    </div>
  );
}
