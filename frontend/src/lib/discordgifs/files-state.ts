import {
  ConversionPresetId,
  ConversionTarget,
  conversionTargetPresets,
} from '@/lib/discordgifs/conversion-target';
import {
  ClipTrim,
  ClipCrop,
  FFmpegConversionState,
  FFmpegFileData,
  FFmpegFileDataOutput,
} from '@/lib/types/discordgifs';
import { getFileOutputEligibility } from './eligibility';

export type FileAction =
  | {
      type: 'updateCrop';
      payload: { name: string; crop: ClipCrop | undefined };
    }
  | {
      type: 'updateTrim';
      payload: { name: string; trim: ClipTrim | undefined };
    }
  | {
      type: 'updateDuration';
      payload: { name: string; seconds: number | null };
    }
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
      type: 'updateIdleOutputTypes';
      payload: { outputTypes: Array<ConversionPresetId> };
    }
  | {
      type: 'addFile';
      payload: { file: File; outputTypes: Array<ConversionPresetId> };
    }
  | {
      type: 'addFiles';
      payload: { files: File[]; outputTypes: Array<ConversionPresetId> };
    }
  | {
      type: 'updateTarget';
      payload: { name: string; target: ConversionTarget };
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
    case 'updateCrop':
      return {
        ...state,
        [action.payload.name]: {
          ...state[action.payload.name],
          crop: action.payload.crop,
        },
      };
    case 'updateTrim':
      return {
        ...state,
        [action.payload.name]: {
          ...state[action.payload.name],
          trim: action.payload.trim,
        },
      };
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
      const fileData = state[action.payload.name];
      if (!fileData) return state;
      const { eligibleOutputTypes } = getFileOutputEligibility(fileData);
      const doneAfterAdding =
        fileData.outputs.length === eligibleOutputTypes.length - 1;
      const conversionState = doneAfterAdding
        ? 'done'
        : fileData.conversionState;

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
    case 'updateIdleOutputTypes':
      return Object.fromEntries(
        Object.entries(state).map(([name, fileData]) => [
          name,
          fileData.conversionState === 'idle'
            ? {
                ...fileData,
                outputTypes: [...action.payload.outputTypes],
              }
            : fileData,
        ])
      );

    case 'addFile':
      return {
        ...state,
        [action.payload.file.name]: {
          file: action.payload.file,
          outputs: [],
          outputTypes: [...action.payload.outputTypes],
          progress: 0,
          size: 0,
          currentTarget:
            conversionTargetPresets[action.payload.outputTypes[0]] ??
            conversionTargetPresets.emote,
          conversionState: 'idle',
          duration: { status: 'checking' },
        },
      };
    case 'addFiles':
      const newFiles = action.payload.files.reduce(
        (acc, file) => {
          acc[file.name] = {
            file,
            outputs: [],
            outputTypes: [...action.payload.outputTypes],
            progress: 0,
            size: 0,
            currentTarget:
              conversionTargetPresets[action.payload.outputTypes[0]] ??
              conversionTargetPresets.emote,
            conversionState: 'idle',
            duration: { status: 'checking' },
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

    case 'updateDuration': {
      if (!state[action.payload.name]) return state;
      return {
        ...state,
        [action.payload.name]: {
          ...state[action.payload.name],
          duration:
            action.payload.seconds === null
              ? { status: 'unknown' }
              : { status: 'known', seconds: action.payload.seconds },
        },
      };
    }

    case 'removeFile':
      const { [action.payload.name]: _, ...rest } = state;
      return rest;
    case 'removeAll':
      return {};
    default:
      return state;
  }
};
