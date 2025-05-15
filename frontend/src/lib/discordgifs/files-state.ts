import { SizeInfo, sizeInfo } from '@/lib/discordgifs/frame-size-calculator';
import {
  FFmpegConversionState,
  FFmpegFileData,
  FFmpegFileDataOutput,
} from '@/lib/types/discordgifs';

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
      type: 'updateOutputs';
      payload: { name: string; outputs: Array<FFmpegFileDataOutput> };
    }
  | {
      type: 'addOutput';
      payload: { name: string; output: FFmpegFileDataOutput };
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
      type: 'addFiles';
      payload: { files: File[] };
    }
  | {
      type: 'updateTarget';
      payload: { name: string; target: SizeInfo };
    }
  | {
      type: 'updateFileConversionState';
      payload: { name: string; conversionState: FFmpegConversionState };
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
    case 'updateOutputs':
      return {
        ...state,
        [action.payload.name]: {
          ...state[action.payload.name],
          outputs: action.payload.outputs,
        },
      };
    case 'addOutput': {
      const doneAfterAdding =
        state[action.payload.name].outputs.length ===
        state[action.payload.name].outputTypes.length - 1;
      const conversionState = doneAfterAdding
        ? 'done'
        : state[action.payload.name].conversionState;

      return {
        ...state,
        [action.payload.name]: {
          ...state[action.payload.name],
          outputs: [
            ...state[action.payload.name].outputs,
            action.payload.output,
          ],
          conversionState,
        },
      };
    }
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
          currentTarget: sizeInfo.emote,
          conversionState: 'idle',
        },
      };
    case 'addFiles':
      const newFiles = action.payload.files.reduce(
        (acc, file) => {
          acc[file.name] = {
            file,
            outputs: [],
            outputTypes: ['emote'],
            progress: 0,
            size: 0,
            currentTarget: sizeInfo.emote,
            conversionState: 'idle',
          };
          return acc;
        },
        {} as Record<string, FFmpegFileData>
      );
      return {
        ...state,
        ...newFiles,
      };
    case 'updateTarget':
      return {
        ...state,
        [action.payload.name]: {
          ...state[action.payload.name],
          currentTarget: action.payload.target,
        },
      };

    case 'updateFileConversionState':
      return {
        ...state,
        [action.payload.name]: {
          ...state[action.payload.name],
          conversionState: action.payload.conversionState,
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
