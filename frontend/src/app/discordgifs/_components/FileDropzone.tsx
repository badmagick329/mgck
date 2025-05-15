'use client';

import { filesStateReducer } from '@/lib/discordgifs/files-state';
import { FFmpegManager } from '@/lib/discordgifs/ffmpeg-manager';
import clsx from 'clsx';
import { useEffect, useReducer, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import ConvertedFile from './ConvertedFile';
import { convert } from '@/lib/discordgifs';

const maxFiles = 6;
const acceptedImageTypes = ['.gif'];
const acceptedVideoTypes = [
  '.mp4',
  '.mkv',
  '.webm',
  '.mov',
  '.avi',
  '.flv',
  '.ts',
  '.m4v',
];
const acceptedTypes = {
  'image/*': acceptedImageTypes,
  'video/*': acceptedVideoTypes,
};

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

  const totalFiles = Object.values(filesState).reduce(
    (count, file) => count + (file.conversionState === 'idle' ? 1 : 0),
    0
  );

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
    // TODO: wtf? Refactor?
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
        const newFiles = [];
        for (let i = 0; i < fileItems.length; i++) {
          if (totalFiles + i + 1 > maxFiles) {
            break;
          }
          newFiles.push(fileItems[i]);
        }
        dispatch({
          type: 'addFiles',
          payload: { files: newFiles },
        });

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
    <div className='flex w-full grow flex-col items-center gap-8 px-2'>
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
