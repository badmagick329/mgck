import { FFmpegLogEvent } from '@/lib/types/discordgifs';

/**
 * Reads FFmpeg's log during a run and keeps the first line that explains a
 * failure the person can fix. The browser previews and trims with its own
 * decoders, which handle codecs this FFmpeg core can't (it has no software
 * AV1 decoder), so the editor works and only FFmpeg's log says why the
 * conversion then fails. It keeps one string rather than the log, which runs
 * to thousands of lines on a long clip.
 */
export class FailureDiagnosis {
  private found: string | undefined;

  readonly listener = ({ message }: FFmpegLogEvent): void => {
    this.found ??= explainLogLine(message);
  };

  get reason(): string | undefined {
    return this.found;
  }
}

// FFmpeg 5.1 spells it "suppport"; accept the fixed spelling too.
const hardwareOnlyDecoder =
  /doesn't sup+ort hardware accelerated (\w+) decoding/;
const missingDecoder = /Decoder \(codec (\w+)\) not found/;

function explainLogLine(message: string): string | undefined {
  const codec =
    hardwareOnlyDecoder.exec(message)?.[1] ?? missingDecoder.exec(message)?.[1];
  if (!codec) return undefined;
  return `This video is ${codec.toUpperCase()}, which the converter can't read. Save it as an H.264 MP4 first, then try again.`;
}
