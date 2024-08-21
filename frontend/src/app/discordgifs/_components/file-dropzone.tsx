'use client';

import {
  FileAction,
  FilesState,
  filesStateReducer,
} from '@/app/discordgifs/_utils/files-state';
import { SizeInfo, sizeInfo } from '@/lib/ffmpeg-utils/frame-size-calculator';
import { FFmpegManager } from '@/lib/ffmpeg-utils/manager';
import { FFmpegConversionState, FFmpegProgressEvent } from '@/lib/types';
import clsx from 'clsx';
import { Dispatch, useEffect, useReducer, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import ConvertedFile from './converted-file';

const maxFiles = 5;

export default function FileDropzone() {
  const [isLoaded, setIsLoaded] = useState<boolean | null>(null);
  const [filesState, dispatch] = useReducer(filesStateReducer, {});
  const [dropError, setDropError] = useState<string | null>(null);
  const [dragEnter, setDragEnter] = useState<boolean>(false);
  const ffmpegRef = useRef<FFmpegManager>(new FFmpegManager());
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    accept: acceptedTypes,
    onDragEnter: (e) => {
      setDragEnter(true);
    },
    onDragLeave: (e) => {
      setDragEnter(false);
    },
    onDropAccepted: (files) => {
      setDragEnter(false);
      setDropError('');
    },
    onDropRejected: (fileRejections) => {
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
    dispatch({ type: 'removeAll', payload: {} });
    acceptedFiles.map((f) => {
      dispatch({
        type: 'addFile',
        payload: { file: f },
      });
    });
  }, [acceptedFiles]);

  const buttonEnabled =
    Object.values(filesState).every((d) => d.conversionState === 'idle') &&
    acceptedFiles.length > 0;

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
          'flex flex-col items-center gap-4 bg-secondaryDg',
          'rounded-md px-6 py-8 hover:cursor-pointer',
          `shadow-glowSecondaryDg ${dragEnter && 'scale-110'}`
        )}
      >
        <input {...getInputProps()} />
        <p>Drag n drop files here, or click to select files.</p>
        <p className='pb-4'>
          Accepted types are{' '}
          <span className='font-semibold'>
            {acceptedImageTypes.join(', ')}, {acceptedVideoTypes.join(', ')}
          </span>
        </p>
        <p className='text-sm'>You can select upto {maxFiles} files.</p>
      </div>
      <button
        className={clsx(
          `${buttonEnabled && 'hover:bg-primaryDg/80'}`,
          `${!buttonEnabled ? 'bg-secondaryDg' : 'bg-primaryDg'}`,
          `rounded-md border-2 border-orange-500`,
          `px-4 py-2 disabled:border-orange-500/60 disabled:text-foreground/60`,
          `shadow-glowPrimaryDg ${!buttonEnabled && dragEnter && 'animate-pulse'}`
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
      const start = performance.now();
      await ffmpeg.optimizeInput();
      console.log(
        `Optimize input took: ${((performance.now() - start) / 1000).toFixed(2)}s`
      );
      const { url, outputName, finalSize } = await ffmpeg.convert();
      dispatch({
        type: 'addOutput',
        payload: {
          name,
          output: { name: outputName, url, type: outputType, finalSize },
        },
      });
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
