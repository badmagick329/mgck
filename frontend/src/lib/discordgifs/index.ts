import { Dispatch } from 'react';
import {
  ConversionTarget,
  conversionTargetPresets,
  orderConversionPresetIds,
} from './conversion-target';
import { FFmpegManager } from './ffmpeg-manager';
import { FilesState, FileAction } from './files-state';
import {
  FFmpegProgressEvent,
  FFmpegConversionState,
} from '../types/discordgifs';

export async function convert(
  ffmpegRef: React.MutableRefObject<FFmpegManager>,
  filesState: FilesState,
  dispatch: Dispatch<FileAction>
) {
  if (!ffmpegRef.current.loaded()) {
    await ffmpegRef.current.load();
  }
  const ffmpeg = ffmpegRef.current;
  for (const [name, data] of Object.entries(filesState)) {
    if (data.conversionState !== 'idle') {
      continue;
    }

    const {
      progressCallback,
      updateFileConversionStateCallback,
      targetCallback,
      sizeCallback,
    } = createCallbacks(name, dispatch);
    ffmpeg
      .setProgressCallback(progressCallback)
      .setNewSizeCallback(sizeCallback)
      .setUpdateConversionStateCallback(updateFileConversionStateCallback);

    for (const outputType of orderConversionPresetIds(data.outputTypes)) {
      const target = conversionTargetPresets[outputType];
      ffmpeg.setFileConfig({
        file: data.file,
        target,
      });
      targetCallback(target);
      sizeCallback(0);
      const result = await ffmpeg.convert();
      if (result) {
        const {
          url,
          outputName,
          finalSize,
          targetId,
          format,
          mimeType,
          width,
        } = result;
        dispatch({
          type: 'addOutput',
          payload: {
            name,
            output: {
              name: outputName,
              url,
              type: outputType,
              finalSize,
              targetId,
              format,
              mimeType,
              width,
            },
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
  }
}

function createCallbacks(name: string, dispatch: Dispatch<FileAction>) {
  const progressCallback = ({ progress }: FFmpegProgressEvent) => {
    dispatch({
      type: 'updateProgress',
      payload: { name, progress },
    });
  };
  const targetCallback = (target: ConversionTarget) => {
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
  const updateFileConversionStateCallback = (
    conversionState: FFmpegConversionState
  ) => {
    dispatch({
      type: 'updateFileConversionState',
      payload: { name, conversionState },
    });
  };

  return {
    progressCallback,
    targetCallback,
    sizeCallback,
    updateFileConversionStateCallback,
  };
}
