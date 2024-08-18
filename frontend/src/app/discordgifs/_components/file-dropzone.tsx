'use client';

import {
  FileAction,
  FilesState,
  filesStateReducer,
} from '@/app/discordgifs/_utils/files-state';
import { sizeInfo } from '@/lib/ffmpeg-utils/frame-size-calculator';
import { FFmpegManager } from '@/lib/ffmpeg-utils/manager';
import { FFmpegProgressEvent } from '@/lib/types';
import { Dispatch, useEffect, useReducer, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import ConvertedFile from './converted-file';

const MAX_FILES = 5;

export default function FileDropzone() {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [filesState, dispatch] = useReducer(filesStateReducer, {});
  const [dropError, setDropError] = useState<string | null>(null);
  const ffmpegRef = useRef<FFmpegManager>(new FFmpegManager());
  const { acceptedFiles, fileRejections, getRootProps, getInputProps } =
    useDropzone({
      accept: acceptedTypes,
      onDragEnter: (e) => {
        console.log('onDragEnter', e);
      },
      onDragLeave: (e) => {
        console.log('onDragLeave', e);
      },
      onDropAccepted: (files) => {
        console.log('onDropAccepted', files);
        setDropError('');
      },
      maxFiles: MAX_FILES,
      onDropRejected: (fileRejections) => {
        for (const rejection of fileRejections) {
          for (const err of rejection.errors) {
            if (err.code === 'too-many-files') {
              setDropError(`You can only upload upto ${MAX_FILES} files`);
            }
          }
        }
      },
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

  const buttonDisabled =
    Object.values(filesState).every((d) => d.isDone) ||
    Object.values(filesState).length === 0 ||
    Object.values(filesState).some((d) => d.isConverting);

  if (!isLoaded) {
    return <p>Loading ffmpeg...</p>;
  }

  if (!ffmpegRef.current.loaded()) {
    return (
      <>
        <p>Failed to load ffmpeg. Refresh to try again</p>
      </>
    );
  }

  return (
    <div className='flex w-full flex-col items-center gap-4 px-2'>
      <div
        {...getRootProps({ className: 'dropzone' })}
        className='flex flex-col items-center gap-2 rounded-md bg-secondary px-6 py-8 hover:cursor-pointer'
      >
        <input {...getInputProps()} />
        <p>Drag n drop files here, or click to select files.</p>
        <p>You can select upto {MAX_FILES} files.</p>
        <p>
          Accepted types are{' '}
          <span className='font-semibold'>
            {acceptedImageTypes.join(', ')}, {acceptedVideoTypes.join(', ')}
          </span>
        </p>
      </div>
      <button
        className='rounded-md border-2 border-foreground px-4 py-2 disabled:border-foreground/60 disabled:text-foreground/60'
        onClick={(e) => convert(ffmpegRef, filesState, dispatch)}
        disabled={buttonDisabled}
      >
        Convert
      </button>
      {dropError && <p className='font-semibold text-red-500'>{dropError}</p>}
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
      sizeCallback,
      isConvertingCallback,
      isDoneCallback,
    } = createCallbacks(name, dispatch);
    ffmpeg
      .setProgressCallback(progressCallback)
      .setNewSizeCallback(sizeCallback)
      .setIsConvertingCallback(isConvertingCallback)
      .setIsDoneCallback(isDoneCallback);

    for (const outputType of data.outputTypes) {
      ffmpeg.setFileConfig({
        file: data.file,
        info: sizeInfo[outputType],
      });
      await ffmpeg.optimizeInput();
      const { url, outputName, finalSize } = await ffmpeg.convert();
      dispatch({
        type: 'addOutput',
        payload: {
          name,
          output: { name: outputName, url, type: outputType, finalSize },
        },
      });
      await ffmpeg.cleanupOptimizedFile();
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
  const sizeCallback = (size: number) => {
    dispatch({
      type: 'updateSize',
      payload: { name, size },
    });
  };
  const isConvertingCallback = (isConverting: boolean) => {
    dispatch({
      type: 'updateIsConverting',
      payload: { name, isConverting },
    });
  };
  const isDoneCallback = (isDone: boolean) => {
    dispatch({
      type: 'updateIsDone',
      payload: { name, isDone },
    });
  };
  return {
    progressCallback,
    sizeCallback,
    isConvertingCallback,
    isDoneCallback,
  };
}
