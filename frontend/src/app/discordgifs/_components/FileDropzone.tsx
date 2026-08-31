'use client';

import {
  FileAction,
  FilesState,
  filesStateReducer,
} from '@/lib/discordgifs/files-state';
import {
  ConversionPresetId,
  conversionTargetPresets,
  defaultConversionPresetSelection,
} from '@/lib/discordgifs/conversion-target';
import { hasEligibleIdleFile } from '@/lib/discordgifs/eligibility';
import { readFileDuration } from '@/lib/discordgifs/file-duration';
import clsx from 'clsx';
import { useCallback, useEffect, useReducer, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import ConvertedFile from './ConvertedFile';
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

export default function FileDropzone() {
  const { ffmpegRef, isLoaded } = useFFmpeg();
  const [filesState, dispatch] = useReducer(filesStateReducer, {});
  const [dropError, setDropError] = useState<string | null>(null);
  const [dragEnter, setDragEnter] = useState<boolean>(false);
  const [conversionInProgress, setConversionInProgress] = useState(false);
  const [selectedOutputTypes, setSelectedOutputTypes] = useState<
    ConversionPresetId[]
  >([...defaultConversionPresetSelection]);

  const checkFileDuration = useCallback((file: File) => {
    void readFileDuration(file).then((seconds) => {
      dispatch({
        type: 'updateDuration',
        payload: { name: file.name, seconds },
      });
    });
  }, []);

  const { acceptedFiles, getRootProps, getInputProps, fileRejections } =
    useDropzone({
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
      },
      onDropRejected: (fileRejections) => {
        setDragEnter(false);
        for (const rejection of fileRejections) {
          for (const err of rejection.errors) {
            if (err.code === 'too-many-files') {
              setDropError(`You can only upload up to ${maxFiles} files`);
              return;
            }
          }
        }
      },
      maxFiles,
    });

  const totalFiles = Object.values(filesState).reduce(
    (count, file) => count + (file.conversionState === 'idle' ? 1 : 0),
    0
  );

  useEffect(() => {
    if (acceptedFiles.length === 0) return;

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
    }
    setDropError(null);
  }, [acceptedFiles]);

  const onFilesPasted = useCallback(
    (fileItems: File[]) => {
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

      setDropError(null);
    },
    [selectedOutputTypes, totalFiles]
  );

  useFilePaste(onFilesPasted);

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
      <div className='max-w-2xl px-2 text-sm text-foreground-dg/80'>
        <p>
          🫣 Stickers have to be{' '}
          {conversionTargetPresets.sticker.maxDurationSeconds} seconds or less,
          or Discord won&apos;t accept them.
        </p>
      </div>
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
        <p>Drag and drop files here, or click to select files.</p>
        <p>You can also paste files from clipboard (Ctrl+V).</p>
        <p className='pb-4'>
          Accepted types are{' '}
          <span className='font-semibold'>
            {acceptedImageTypes.join(', ')}, {acceptedVideoTypes.join(', ')}
          </span>
        </p>
        <MoreFilesText totalFiles={totalFiles} maxFiles={maxFiles} />
      </div>
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
        onClick={() => {
          setConversionInProgress(true);
          void convert(ffmpegRef, filesState, dispatch)
            .catch((error) => {
              console.error('Conversion error:', error);
            })
            .finally(() => {
              setConversionInProgress(false);
            });
        }}
        disabled={!buttonEnabled}
      >
        Convert
      </button>
      {dropError && <p className='font-semibold text-red-500'>{dropError}</p>}
      <ConvertedFiles
        filesState={filesState}
        dispatch={dispatch}
        setDropError={setDropError}
      />
    </div>
  );
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
  dispatch,
  setDropError,
}: {
  filesState: FilesState;
  dispatch: (value: FileAction) => void;
  setDropError: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  return (
    <div className='mt-8 flex flex-wrap justify-center gap-8 px-4 text-center'>
      {Object.keys(filesState).length > 0 &&
        Object.entries(filesState).map(([name, data]) => (
          <ConvertedFile
            key={name}
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
