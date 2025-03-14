'use client';

import {
  FileAction,
  FilesState,
  filesStateReducer,
} from '@/lib/discordgifs/files-state';
import { FFmpegManager } from '@/lib/discordgifs/ffmpeg-manager';
import { SizeInfo, sizeInfo } from '@/lib/discordgifs/frame-size-calculator';
import {
  FFmpegConversionState,
  FFmpegProgressEvent,
} from '@/lib/types/discordgifs';
import clsx from 'clsx';
import { Dispatch, useEffect, useReducer, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import ConvertedFile from './ConvertedFile';

const maxFiles = 6;

export default function FileDropzone() {
  const [isLoaded, setIsLoaded] = useState<boolean | null>(null);
  const [filesState, dispatch] = useReducer(filesStateReducer, {});
  const [dropError, setDropError] = useState<string | null>(null);
  const [dragEnter, setDragEnter] = useState<boolean>(false);

  const ffmpegRef = useRef<FFmpegManager>(new FFmpegManager());
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
              setDropError(`You can only upload upto ${maxFiles} files`);
              return;
            }
          }
        }
      },
      maxFiles,
    });

  const totalFiles = Object.keys(filesState).filter(
    (d) => filesState[d].conversionState === 'idle'
  ).length;

  useEffect(() => {
    (async () => {
      await ffmpegRef.current.load();
      setIsLoaded(true);
    })();
    return () => {
      ffmpegRef.current.terminate();
    };
  }, []);

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
        payload: { file },
      });
    }
    setDropError(null);
  }, [acceptedFiles]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const pastedItems = event.clipboardData?.items;
      if (!pastedItems) return;

      const fileItems = [];

      for (let i = 0; i < pastedItems.length; i++) {
        const item = pastedItems[i];

        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            const fileExtension = `.${file.name.split('.').pop()}`;
            const isAcceptedType = [
              ...acceptedImageTypes,
              ...acceptedVideoTypes,
            ].includes(fileExtension);

            if (
              isAcceptedType &&
              (file.type.startsWith('image/') || file.type.startsWith('video/'))
            ) {
              fileItems.push(file);
            }
          }
        }
      }

      if (fileItems.length > 0) {
        if (totalFiles + 1 > maxFiles) {
          setDropError(`You can only upload up to ${maxFiles} files.`);
          return;
        }
        for (let i = 0; i < fileItems.length; i++) {
          if (totalFiles + i + 1 > maxFiles) {
            break;
          }
          const file = fileItems[i];
          dispatch({
            type: 'addFile',
            payload: { file },
          });
        }

        setDropError(null);
        console.log('total files now', totalFiles + fileItems.length);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [totalFiles]);

  const buttonEnabled =
    Object.values(filesState).some((d) => d.conversionState === 'idle') &&
    totalFiles > 0;

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
    <div className='flex w-full flex-col items-center gap-8 px-2'>
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
        <p>Drag n drop files here, or click to select files.</p>
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
        onClick={(e) => convert(ffmpegRef, filesState, dispatch)}
        disabled={!buttonEnabled}
      >
        Convert
      </button>
      {dropError && <p className='font-semibold text-red-500'>{dropError}</p>}
      <div className='mt-8 flex flex-wrap justify-center gap-8 px-4 text-center'>
        {Object.keys(filesState).length > 0 &&
          Object.entries(filesState).map(([name, data], idx) => (
            <ConvertedFile
              key={name}
              fileData={data}
              buttonsEnabled={buttonEnabled}
              removeFile={() => {
                dispatch({
                  type: 'removeFile',
                  payload: { name },
                });

                setDropError(null);
              }}
              setOutputTypes={(targets) => {
                dispatch({
                  type: 'updateOutputTypes',
                  payload: { name, outputTypes: targets },
                });
              }}
            />
          ))}
      </div>
    </div>
  );
}

const acceptedImageTypes = ['.gif'];
const acceptedVideoTypes = ['.mp4', '.mkv', '.webm'];
const acceptedTypes = {
  'image/*': acceptedImageTypes,
  'video/*': acceptedVideoTypes,
};

function MoreFilesText({
  totalFiles,
  maxFiles,
}: {
  totalFiles: number;
  maxFiles: number;
}) {
  if (totalFiles === 0) {
    return (
      <p className='text-xs'>You can add upto {maxFiles} files at a time.</p>
    );
  }

  if (totalFiles >= maxFiles) {
    return <p className='text-xs'>You cannot add more files.</p>;
  }

  return (
    <p className='text-xs'>You can add {maxFiles - totalFiles} more file(s).</p>
  );
}

async function convert(
  ffmpegRef: React.MutableRefObject<FFmpegManager>,
  filesState: FilesState,
  dispatch: Dispatch<FileAction>
) {
  if (!ffmpegRef.current.loaded()) {
    return;
  }
  const ffmpeg = ffmpegRef.current;
  for (const [name, data] of Object.entries(filesState)) {
    if (data.conversionState !== 'idle') {
      continue;
    }

    const {
      progressCallback,
      updateConversionStateCallback,
      targetCallback,
      sizeCallback,
    } = createCallbacks(name, dispatch);
    ffmpeg
      .setProgressCallback(progressCallback)
      .setNewSizeCallback(sizeCallback)
      .setUpdateConversionStateCallback(updateConversionStateCallback);

    for (const outputType of data.outputTypes) {
      ffmpeg.setFileConfig({
        file: data.file,
        info: sizeInfo[outputType],
      });
      targetCallback(sizeInfo[outputType]);
      sizeCallback(0);
      const result = await ffmpeg.convert();
      if (result) {
        const { url, outputName, finalSize } = result;
        dispatch({
          type: 'addOutput',
          payload: {
            name,
            output: { name: outputName, url, type: outputType, finalSize },
          },
        });
      } else {
        dispatch({
          type: 'addOutput',
          payload: {
            name,
            output: { name: '', url: '', type: '' },
          },
        });
      }
    }

    await ffmpeg.deleteFile(data.file.name);
  }
}

function createCallbacks(name: string, dispatch: Dispatch<FileAction>) {
  const progressCallback = ({ progress }: FFmpegProgressEvent) => {
    dispatch({
      type: 'updateProgress',
      payload: { name, progress },
    });
  };
  const targetCallback = (target: SizeInfo) => {
    dispatch({
      type: 'updateTarget',
      payload: { name, target },
    });
  };
  const sizeCallback = (size: number) => {
    dispatch({
      type: 'updateSize',
      payload: { name, size },
    });
  };
  const updateConversionStateCallback = (
    conversionState: FFmpegConversionState
  ) => {
    dispatch({
      type: 'updateConversionState',
      payload: { name, conversionState },
    });
  };

  return {
    progressCallback,
    targetCallback,
    sizeCallback,
    updateConversionStateCallback,
  };
}
