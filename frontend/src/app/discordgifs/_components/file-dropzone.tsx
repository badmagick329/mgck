'use client';

import { loadFFmpeg, toEmote } from '@/lib/discordgifs/ffmpeg-utils';
import { FFmpegFileData, FFmpegProgressEvent } from '@/lib/types';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import ConvertedFile from './converted-file';

export default function FileDropzone() {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [fileDatas, setFileDatas] = useState<FFmpegFileData[]>([]);
  const ffmpegRef = useRef<FFmpeg | null>(null);
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
      },
    });
  const buttonDisabled =
    fileDatas.every((d) => d.isDone) || fileDatas.length === 0;

  useEffect(() => {
    load(ffmpegRef, setIsLoaded);
    return () => {
      if (ffmpegRef.current) {
        ffmpegRef.current.terminate();
      }
    };
  }, []);

  useEffect(() => {
    const newFileDatas: FFmpegFileData[] = [];
    acceptedFiles.map((f) => {
      newFileDatas.push({
        file: f,
        outputUrl: '',
        outputName: '',
        progress: 0,
        size: 0,
        isConverting: false,
        isDone: false,
      });
    });
    setFileDatas(newFileDatas);
  }, [acceptedFiles]);

  async function doStuff() {
    if (!ffmpegRef.current) {
      return;
    }
    const ffmpeg = ffmpegRef.current;
    for (let i = 0; i < fileDatas.length; i++) {
      const data = fileDatas[i];
      const progressHandler = ({ progress }: FFmpegProgressEvent) => {
        updateProgress(progress, i);
      };
      const { url, outputName } = await toEmote({
        file: data.file,
        ffmpeg,
        progressHandler,
        setNewSize: (size) => {
          updateSize(size, i);
        },
        setIsConverting: (converting) => {
          setIsConverting(converting, i);
        },
        setIsDone: (done) => {
          setIsDone(done, i);
        },
      });
      setFileDatas((prevData) => {
        return prevData.map((d, idx) => {
          if (idx === i) {
            return { ...d, outputUrl: url, outputName };
          }
          return d;
        });
      });
    }
  }

  function updateProgress(progress: number, i: number) {
    setFileDatas((prevDatas) => {
      return prevDatas.map((d, index) => {
        if (index === i) {
          return { ...d, progress };
        }
        return d;
      });
    });
  }

  function updateSize(size: number, i: number) {
    setFileDatas((prevDatas) => {
      return prevDatas.map((d, index) => {
        if (index === i) {
          return { ...d, size };
        }
        return d;
      });
    });
  }

  function setIsDone(done: boolean, i: number) {
    setFileDatas((prevDatas) => {
      return prevDatas.map((d, index) => {
        if (index === i) {
          return { ...d, isDone: done };
        }
        return d;
      });
    });
  }

  function setIsConverting(converting: boolean, i: number) {
    setFileDatas((prevDatas) => {
      return prevDatas.map((d, index) => {
        if (index === i) {
          return { ...d, isConverting: converting };
        }
        return d;
      });
    });
  }

  if (!isLoaded) {
    return <p>Loading ffmpeg...</p>;
  }

  if (!ffmpegRef.current) {
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
        className='rounded-md bg-secondary px-4 py-2 hover:cursor-pointer'
      >
        <input {...getInputProps()} />
        <p>Drag n drop files here, or click to select files</p>
        <p>
          Accepted types are{' '}
          <span className='font-semibold'>
            {acceptedImageTypes.join(', ')}, {acceptedVideoTypes.join(', ')}
          </span>
        </p>
      </div>
      <button
        className='rounded-md border-2 border-foreground px-4 py-2 disabled:border-foreground/60 disabled:text-foreground/60'
        onClick={(e) => {
          doStuff();
        }}
        disabled={buttonDisabled}
      >
        Do Stuff
      </button>
      {fileDatas.length > 0 &&
        fileDatas.map((data) => {
          return <ConvertedFile key={data.file.name} fileData={data} />;
        })}
    </div>
  );
}

const acceptedImageTypes = ['.gif'];
const acceptedVideoTypes = ['.mp4', '.mkv', '.webm'];
const acceptedTypes = {
  'image/*': acceptedImageTypes,
  'video/*': acceptedVideoTypes,
};

async function load(
  ffmpegRef: MutableRefObject<FFmpeg | null>,
  setIsLoaded: (isLoaded: boolean) => void
) {
  const ffmpegResponse: FFmpeg = await loadFFmpeg();
  ffmpegRef.current = ffmpegResponse;
  setIsLoaded(true);
}
