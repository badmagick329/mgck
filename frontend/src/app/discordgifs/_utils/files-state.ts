import { sizeInfo } from '@/lib/ffmpeg-utils/frame-size-calculator';
import { FFmpegFileData, FFmpegFileDataOutput } from '@/lib/types';

export type FileAction =
  | {
      type: 'updateProgress';
      payload: { name: string; progress: number };
    }
  | {
      type: 'updateSize';
      payload: { name: string; size: number };
    }
  | {
      type: 'updateIsConverting';
      payload: { name: string; isConverting: boolean };
    }
  | {
      type: 'updateIsDone';
      payload: { name: string; isDone: boolean };
    }
  | {
      type: 'updateOutputs';
      payload: { name: string; outputs: Array<FFmpegFileDataOutput> };
    }
  | {
      type: 'updateOutputTypes';
      payload: { name: string; outputTypes: Array<keyof typeof sizeInfo> };
    }
  | {
      type: 'addFile';
      payload: { file: File };
    }
  | {
      type: 'removeFile';
      payload: { name: string };
    }
  | {
      type: 'removeAll';
      payload: {};
    };

export type FilesState = Record<string, FFmpegFileData>;

export const filesStateReducer = (
  state: FilesState,
  action: FileAction
): FilesState => {
  switch (action.type) {
    case 'updateProgress':
      return {
        ...state,
        [action.payload.name]: {
          ...state[action.payload.name],
          progress: action.payload.progress,
        },
      };
    case 'updateSize':
      return {
        ...state,
        [action.payload.name]: {
          ...state[action.payload.name],
          size: action.payload.size,
        },
      };
    case 'updateIsConverting':
      return {
        ...state,
        [action.payload.name]: {
          ...state[action.payload.name],
          isConverting: action.payload.isConverting,
        },
      };
    case 'updateIsDone':
      return {
        ...state,
        [action.payload.name]: {
          ...state[action.payload.name],
          isDone: action.payload.isDone,
        },
      };
    case 'updateOutputs':
      return {
        ...state,
        [action.payload.name]: {
          ...state[action.payload.name],
          outputs: action.payload.outputs,
        },
      };
    case 'updateOutputTypes':
      return {
        ...state,
        [action.payload.name]: {
          ...state[action.payload.name],
          outputTypes: action.payload.outputTypes,
        },
      };

    case 'addFile':
      return {
        ...state,
        [action.payload.file.name]: {
          file: action.payload.file,
          outputs: [],
          outputTypes: ['emote'],
          progress: 0,
          size: 0,
          isConverting: false,
          isDone: false,
        },
      };
    case 'removeFile':
      const { [action.payload.name]: _, ...rest } = state;
      return rest;
    case 'removeAll':
      return {};
    default:
      return state;
  }
};
