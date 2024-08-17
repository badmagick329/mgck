'use client';

import { FFmpegManager } from '@/lib/discordgifs/ffmpeg-utils';
import { sizeInfo } from '@/lib/discordgifs/frame-size-calculator';
import { FFmpegFileData, FFmpegProgressEvent } from '@/lib/types';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import ConvertedFile from './converted-file';

const MAX_FILES = 5;

export default function FileDropzone() {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [fileDatas, setFileDatas] = useState<FFmpegFileData[]>([]);
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
    const newFileDatas: FFmpegFileData[] = [];
    acceptedFiles.map((f) => {
      newFileDatas.push({
        file: f,
        outputs: [],
        outputTypes: ['emote'],
        progress: 0,
        size: 0,
        isConverting: false,
        isDone: false,
      });
    });
    setFileDatas(newFileDatas);
  }, [acceptedFiles]);

  const buttonDisabled =
    fileDatas.every((d) => d.isDone) ||
    fileDatas.length === 0 ||
    fileDatas.some((d) => d.isConverting);

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
        onClick={(e) => convert(ffmpegRef, fileDatas, setFileDatas)}
        disabled={buttonDisabled}
      >
        Convert
      </button>
      {dropError && <p className='font-semibold text-red-500'>{dropError}</p>}
      {fileDatas.length > 0 &&
        fileDatas.map((data, i) => {
          return (
            <ConvertedFile
              key={data.file.name}
              fileData={data}
              setOutputTypes={(outputTypes: Array<keyof typeof sizeInfo>) => {
                setOutputTypes(outputTypes, i, setFileDatas);
              }}
            />
          );
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

async function convert(
  ffmpegRef: React.MutableRefObject<FFmpegManager>,
  fileDatas: FFmpegFileData[],
  setFileDatas: Dispatch<SetStateAction<FFmpegFileData[]>>
) {
  if (!ffmpegRef.current.loaded()) {
    return;
  }
  const ffmpeg = ffmpegRef.current;
  for (let i = 0; i < fileDatas.length; i++) {
    const data = fileDatas[i];
    const progressHandler = ({ progress }: FFmpegProgressEvent) => {
      updateProgress(progress, i, setFileDatas);
    };
    for (const outputType of data.outputTypes) {
      ffmpeg
        .setFileConfig({
          file: data.file,
          info: sizeInfo[outputType],
        })
        .setProgressCallback(progressHandler)
        .setNewSizeCallback((size) => {
          updateSize(size, i, setFileDatas);
        })
        .setIsConvertingCallback((converting) => {
          setIsConverting(converting, i, setFileDatas);
        })
        .setIsDoneCallback((done) => {
          setIsDone(done, i, setFileDatas);
        });
      const { url, outputName } = await ffmpeg.convert();
      setFileDatas((prevData) => {
        return prevData.map((d, idx) => {
          if (idx === i) {
            const outputUrls = fileDatas[i].outputs.map(({ url }) => url);
            const outputs = fileDatas[i].outputs;
            // const outputNames = fileDatas[i].outputNames;
            // const savedUrls =
            if (!outputUrls.includes(url)) {
              outputs.push({
                url,
                name: outputName,
                type: outputType,
              });
            }
            return { ...d, outputs };
          }
          return d;
        });
      });
    }

    await ffmpeg.deleteFile(data.file.name);
  }
}

function updateProgress(
  progress: number,
  i: number,
  setFileDatas: Dispatch<SetStateAction<FFmpegFileData[]>>
) {
  setFileDatas((prevDatas) => {
    return prevDatas.map((d, index) => {
      if (index === i) {
        return { ...d, progress };
      }
      return d;
    });
  });
}

function updateSize(
  size: number,
  i: number,
  setFileDatas: Dispatch<SetStateAction<FFmpegFileData[]>>
) {
  setFileDatas((prevDatas) => {
    return prevDatas.map((d, index) => {
      if (index === i) {
        return { ...d, size };
      }
      return d;
    });
  });
}

function setIsDone(
  done: boolean,
  i: number,
  setFileDatas: Dispatch<SetStateAction<FFmpegFileData[]>>
) {
  setFileDatas((prevDatas) => {
    return prevDatas.map((d, index) => {
      if (index === i) {
        return { ...d, isDone: done };
      }
      return d;
    });
  });
}

function setIsConverting(
  converting: boolean,
  i: number,
  setFileDatas: Dispatch<SetStateAction<FFmpegFileData[]>>
) {
  setFileDatas((prevDatas) => {
    return prevDatas.map((d, index) => {
      if (index === i) {
        return { ...d, isConverting: converting };
      }
      return d;
    });
  });
}

function setOutputTypes(
  outputTypes: Array<keyof typeof sizeInfo>,
  i: number,
  setFileDatas: Dispatch<SetStateAction<FFmpegFileData[]>>
) {
  setFileDatas((prevDatas) => {
    return prevDatas.map((d, index) => {
      if (index === i) {
        return { ...d, outputTypes };
      }
      return d;
    });
  });
}
