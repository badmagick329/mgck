import {
  FrameSizeCalculator,
  sizeInfo,
} from '@/lib/discordgifs/frame-size-calculator';

describe('Frame size calculator', () => {
  test('a frame size is returned with width and height as numbers if size is changed', () => {
    const calculator = new FrameSizeCalculator(sizeInfo.emote);
    const result = calculator.getNewFrameSize(1000000 * 1024);
    expect(typeof result).toBe('object');
    expect(typeof result?.width).toBe('number');
    expect(typeof result?.height).toBe('number');
  });
  test('calculator is done as successful when file size is close to limit', () => {
    const calculator = new FrameSizeCalculator(sizeInfo.emote);
    calculator.getNewFrameSize(calculator.info.sizeLimit - 1);
    expect(calculator.isDone).toBe(true);
  });
  test('null is returned when frame is not changed', () => {
    const calculator = new FrameSizeCalculator(sizeInfo.emote);
    const result = calculator.getNewFrameSize(calculator.info.sizeLimit - 1);
    expect(result).toBe(null);
  });
  test('null is returned if the same file size is provided twice', () => {
    const calculator = new FrameSizeCalculator(sizeInfo.emote);
    calculator.getNewFrameSize(1000000 * 1024);
    expect(calculator.getNewFrameSize(1000000 * 1024)).toBe(null);
  });
  test('null is returned for emotes when calculator is done', () => {
    const calculator = new FrameSizeCalculator(sizeInfo.emote);
    calculator.getNewFrameSize(calculator.info.sizeLimit - 1);
    expect(calculator.getNewFrameSize(calculator.info.sizeLimit - 1)).toBe(
      null
    );
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
  test('width and height equal starting width and height when emote is smaller than size limit', () => {
    const calculator = testNullReturnWithMul(1, 1);
    expect(calculator._width).toBe(calculator.info.startingWidth);
    expect(calculator._height).toBe(calculator.info.startingHeight);
  });
  test('calculator finishes with done and successful when width and height equal starting width and height', () => {
    const calculator = testNullReturnWithMul(1, 1);
    expect(calculator._width).toBe(calculator.info.startingWidth);
    expect(calculator._height).toBe(calculator.info.startingHeight);
    expect(calculator.isDone).toBe(true);
    expect(calculator.isSuccessful).toBe(true);
  });
  test('calculator finishes with done and unsuccessful when emote cannot fit size limit', () => {
    const calculator = testNullReturnWithMul(1000, 20);
    expect(calculator.isDone).toBe(true);
    expect(calculator.isSuccessful).toBe(false);
  });
});

function testNullReturnWithMul(mul: number, maxIterations: number) {
  let calculator = new FrameSizeCalculator(sizeInfo.emote);
  let fileSize;
  let result;
  let iteration = 0;
  do {
    fileSize = mockNewFileSize(calculator._width, calculator._height, mul);
    if (fileSize) {
      // console.log(
      //   `fileSize: ${fileSize}. width x height: ${calculator._width} x ${calculator._height}`
      // );
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
