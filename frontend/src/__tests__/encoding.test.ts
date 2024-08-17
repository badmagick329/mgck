import {
  FrameSizeCalculator,
  SizeInfoProps,
  sizeInfo,
} from '@/lib/ffmpeg-utils/frame-size-calculator';

describe('Frame size calculator', () => {
  test('a frame size is returned with width and height as numbers if size is changed', () => {
    const calculator = new FrameSizeCalculator(sizeInfo.emote);
    const result = calculator.getNewFrameSize(1000000 * 1024);
    expect(typeof result).toBe('object');
    expect(typeof result?.width).toBe('number');
    expect(typeof result?.height).toBe('number');
  });
  test('calculator is done as successful when file size is close to limit', () => {
    const infos = [sizeInfo.emote, sizeInfo.sticker];
    for (const info of infos) {
      const calculator = new FrameSizeCalculator(info);
      const reduceBy = calculator.info.sizeLimit * calculator.info.sizeMargin;
      calculator.getNewFrameSize(calculator.info.sizeLimit - reduceBy + 1);
      expect(calculator.isDone).toBe(true);
    }
  });
  test('null is returned when frame is not changed', () => {
    const infos = [sizeInfo.emote, sizeInfo.sticker];
    for (const info of infos) {
      const calculator = new FrameSizeCalculator(info);
      const result = calculator.getNewFrameSize(calculator.info.sizeLimit - 1);
      expect(result).toBe(null);
    }
  });
  test('null is returned if the same file size is provided twice', () => {
    const infos = [sizeInfo.emote, sizeInfo.sticker];
    for (const info of infos) {
      const calculator = new FrameSizeCalculator(info);
      calculator.getNewFrameSize(1000000 * 1024);
      expect(calculator.getNewFrameSize(1000000 * 1024)).toBe(null);
    }
  });
  test('null is returned for emotes when calculator is done', () => {
    const infos = [sizeInfo.emote, sizeInfo.sticker];
    for (const info of infos) {
      const calculator = new FrameSizeCalculator(info);
      calculator.getNewFrameSize(calculator.info.sizeLimit - 1);
      expect(calculator.getNewFrameSize(calculator.info.sizeLimit - 1)).toBe(
        null
      );
    }
  });
  test('null is returned for emotes within 20 iterations', () => {
    const muls = [100, 95, 50, 140, 80];
    for (const mul of muls) {
      testNullReturnWithMul(mul, 20);
    }
  });
  test('calculator finishes with done and successful for emotes within 20 iterations', () => {
    const muls = [100, 95, 50, 140, 80];
    for (const mul of muls) {
      const calculator = testNullReturnWithMul(mul, 20);
      expect(calculator.isDone).toBe(true);
      expect(calculator.isSuccessful).toBe(true);
    }
  });
  test('width and height equal starting width and height when file size is smaller than size limit', () => {
    const infos = [sizeInfo.emote, sizeInfo.sticker];
    for (const info of infos) {
      const calculator = testNullReturnWithMul(1, 1, info);
      expect(calculator._width).toBe(calculator.info.startingWidth);
      expect(calculator._height).toBe(calculator.info.startingHeight);
    }
  });
  test('calculator finishes with done and successful when width and height equal starting width and height', () => {
    const infos = [sizeInfo.emote, sizeInfo.sticker];
    for (const info of infos) {
      const calculator = testNullReturnWithMul(1, 1, info);
      expect(calculator._width).toBe(calculator.info.startingWidth);
      expect(calculator._height).toBe(calculator.info.startingHeight);
      expect(calculator.isDone).toBe(true);
      expect(calculator.isSuccessful).toBe(true);
    }
  });
  test('calculator finishes with done and unsuccessful when emote cannot fit size limit', () => {
    const infos = [sizeInfo.emote, sizeInfo.sticker];
    for (const info of infos) {
      const calculator = testNullReturnWithMul(100000, 20, info);
      expect(calculator.isDone).toBe(true);
      expect(calculator.isSuccessful).toBe(false);
    }
  });
  test('file based change is bigger when the file size is much bigger than the limit', () => {
    const calculator = new FrameSizeCalculator(sizeInfo.emote);
    const bigSizes = [2048 * 1024, 1024 * 1024, 512 * 1024];
    const smallerSizes = [262 * 1024, 260 * 1024, 258 * 1024];
    const limit = 256 * 1024;
    for (let i = 0; i < bigSizes.length; i++) {
      const bigChange = calculator._calculateChangeSizeBasedOnFileSize(
        calculator.info.changeSize,
        bigSizes[i],
        limit,
        calculator.info.minChangeSize
      );
      const smallChange = calculator._calculateChangeSizeBasedOnFileSize(
        calculator.info.changeSize,
        smallerSizes[i],
        limit,
        calculator.info.minChangeSize
      );
      expect(bigChange).toBeGreaterThan(smallChange);
    }
  });
  test('file based change is bigger when the file size is much smaller than the limit', () => {
    const calculator = new FrameSizeCalculator(sizeInfo.emote);
    const smallSizes = [50 * 1024, 80 * 1024, 100 * 1024];
    const biggerSizes = [250 * 1024, 252 * 1024, 254 * 1024];
    const limit = 256 * 1024;
    for (let i = 0; i < smallSizes.length; i++) {
      const smallChange = calculator._calculateChangeSizeBasedOnFileSize(
        calculator.info.changeSize,
        smallSizes[i],
        limit,
        calculator.info.minChangeSize
      );
      const bigChange = calculator._calculateChangeSizeBasedOnFileSize(
        calculator.info.changeSize,
        biggerSizes[i],
        limit,
        calculator.info.minChangeSize
      );
      expect(smallChange).toBeLessThan(bigChange);
    }
  });
});

function testNullReturnWithMul(
  mul: number,
  maxIterations: number,
  info: SizeInfoProps = sizeInfo.emote
) {
  let calculator = new FrameSizeCalculator(info);
  let fileSize;
  let result;
  let iteration = 0;
  do {
    fileSize = mockNewFileSize(calculator._width, calculator._height, mul);
    if (fileSize) {
      result = calculator.getNewFrameSize(fileSize);
      if (result !== null) {
        expect(typeof result).toBe('object');
        expect(typeof result?.width).toBe('number');
        expect(typeof result?.height).toBe('number');
      }
    }

    if (iteration++ > maxIterations) {
      break;
    }
  } while (result);
  expect(result).toBe(null);
  return calculator;
}

function mockNewFileSize(width: number, height: number, mul: number) {
  return Math.round(width * height * mul);
}
