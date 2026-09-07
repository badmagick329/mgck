import {
  ConversionPresetId,
  ConversionTarget,
  conversionTargetPresets,
  orderConversionPresetIds,
} from './conversion-target';
import type { FFmpegFileData } from '../types/discordgifs';

export type FileOutputEligibility = {
  eligibleOutputTypes: ConversionPresetId[];
  excludedOutputTypes: ConversionPresetId[];
};

export function getFileOutputEligibility(
  fileData: Pick<FFmpegFileData, 'duration' | 'outputTypes' | 'trim'>
): FileOutputEligibility {
  const orderedOutputTypes = orderConversionPresetIds(fileData.outputTypes);
  const eligibleOutputTypes: ConversionPresetId[] = [];
  const excludedOutputTypes: ConversionPresetId[] = [];

  for (const outputType of orderedOutputTypes) {
    const target = conversionTargetPresets[outputType] as ConversionTarget;
    const maxDurationSeconds = target.maxDurationSeconds;
    const exceedsDurationLimit =
      maxDurationSeconds !== undefined &&
      fileData.duration.status === 'known' &&
      (fileData.trim
        ? fileData.trim.end - fileData.trim.start
        : fileData.duration.seconds) > maxDurationSeconds;

    if (exceedsDurationLimit) {
      excludedOutputTypes.push(outputType);
    } else {
      eligibleOutputTypes.push(outputType);
    }
  }

  return { eligibleOutputTypes, excludedOutputTypes };
}

export function hasEligibleIdleFile(
  filesState: Record<string, FFmpegFileData>
): boolean {
  return Object.values(filesState).some(
    (fileData) =>
      fileData.conversionState === 'idle' &&
      fileData.duration.status !== 'checking' &&
      getFileOutputEligibility(fileData).eligibleOutputTypes.length > 0
  );
}
