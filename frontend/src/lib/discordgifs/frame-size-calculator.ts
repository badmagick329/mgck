export const sizeInfo = {
  emote: {
    changeSize: 40,
    minChangeSize: 1,
    sizeLimit: 256 * 1024,
    startingWidth: 128,
    startingHeight: 128,
    minWidth: 20,
    minHeight: 20,
  },
};

export type FrameSize = {
  width: number;
  height: number;
};

export type SizeInfoProps = {
  changeSize: number;
  minChangeSize: number;
  sizeLimit: number;
  startingWidth: number;
  startingHeight: number;
  minWidth: number;
  minHeight: number;
};

export class SizeInfo {
  changeSize: number;
  minChangeSize: number;
  sizeLimit: number;
  startingWidth: number;
  startingHeight: number;
  minWidth: number;
  minHeight: number;

  constructor({
    changeSize,
    minChangeSize,
    sizeLimit,
    startingWidth,
    startingHeight,
    minWidth,
    minHeight,
  }: SizeInfoProps) {
    this.changeSize = changeSize;
    this.minChangeSize = minChangeSize;
    this.sizeLimit = sizeLimit;
    this.startingWidth = startingWidth;
    this.startingHeight = startingHeight;
    this.minWidth = minWidth;
    this.minHeight = minHeight;
  }
}

export class FrameSizeCalculator {
  info: SizeInfo;
  _changeSize: number;
  _width: number;
  _height: number;
  _sizeComparisons: Array<number>;
  _lastFileSize: number | null;
  _isDone: boolean;

  constructor(info: SizeInfo) {
    this.info = info;
    this._changeSize = info.changeSize;
    this._width = info.startingWidth;
    this._height = info.startingHeight;
    this._sizeComparisons = [0, 0];
    this._lastFileSize = null;
    this._isDone = false;
  }

  get lowerBound() {
    return this.info.sizeLimit - this.info.sizeLimit * 0.03;
  }

  get isDone() {
    return this._isDone;
  }

  get changeSize() {
    return Math.max(this._changeSize, this.info.minChangeSize);
  }

  get isSuccessful() {
    return (
      this.isDone && (this._maxSizeIsUnderLimit() || this._sizeIsCloseEnough())
    );
  }

  /**
   * Calculates the new frame size based on the given file size.
   *
   * @param fileSize - The size of the file.
   * @returns The new frame size or null if frame size was not changed
   */
  getNewFrameSize(fileSize: number): FrameSize | null {
    if (this.isDone || this._lastFileSize === fileSize) {
      return null;
    }

    this._updateFileSizeAndComparisons(fileSize);

    if (this._maxSizeIsUnderLimit() || this._sizeIsCloseEnough()) {
      this._isDone = true;
      return null;
    }

    if (this._changeDirectionFlipped()) {
      this._reduceChangeSize();
    }

    if (this.changeSize === this.info.minChangeSize) {
      if (this._sizeIsUnderLimit()) {
        this._isDone = true;
        return null;
      }
      return this._reduceSize() ? this.getWidthAndHeight() : null;
    }

    if (this._sizeIsUnderLimit()) {
      return this._increaseSize() ? this.getWidthAndHeight() : null;
    } else {
      return this._reduceSize() ? this.getWidthAndHeight() : null;
    }
  }

  getWidthAndHeight(): FrameSize {
    return {
      width: this._width,
      height: this._height,
    };
  }

  _changeDirectionFlipped(): boolean {
    return (
      (this._sizeComparisons[0] < 0 && this._sizeComparisons[1] > 0) ||
      (this._sizeComparisons[0] > 0 && this._sizeComparisons[1] < 0)
    );
  }

  _reduceSize(): boolean {
    if (this.isDone) {
      return false;
    }

    const oldWidth = this._width;
    const oldHeight = this._height;
    this._width = Math.max(this._width - this.changeSize, this.info.minWidth);
    this._height = Math.max(
      this._height - this.changeSize,
      this.info.minHeight
    );
    if (this._width === oldWidth && this._height === oldHeight) {
      this._isDone = true;
      return false;
    } else {
      return true;
    }
  }

  /**
   * Increases the size of the frame.
   *
   * @returns {boolean} Returns `true` if the size was increased, `false` otherwise.
   */
  _increaseSize(): boolean {
    if (this.isDone) {
      return false;
    }

    const oldWidth = this._width;
    const oldHeight = this._height;
    this._width = Math.min(
      this._width + this.changeSize,
      this.info.startingWidth
    );
    this._height = Math.min(
      this._height + this.changeSize,
      this.info.startingHeight
    );

    if (this._width === oldWidth && this._height === oldHeight) {
      this._isDone = true;
      return false;
    } else {
      return true;
    }
  }

  _updateFileSizeAndComparisons(fileSize: number): void {
    this._lastFileSize = fileSize;
    this._sizeComparisons[1] = this._sizeComparisons[0];
    this._sizeComparisons[0] = this._lastFileSize - this.info.sizeLimit;
  }

  _reduceChangeSize() {
    let bias;
    const divideBy = 1.5;
    if (!this._lastFileSize) {
      bias = 1;
    } else {
      const diff = this._lastFileSize - this.info.sizeLimit;
      // big bias = file size is way off, don't reduce change size by alot
      // small bias = file size is close, reduce change size by a smaller amount
      bias = diff / this.info.sizeLimit;
      bias = Math.min(bias, divideBy * 0.2);
      bias = Math.max(bias, -(divideBy * 0.2));
    }
    this._changeSize = Math.max(
      Math.round(this.changeSize / (divideBy + bias)),
      this.info.minChangeSize
    );
  }

  _sizeIsUnderLimit(): boolean {
    return (
      this._lastFileSize !== null && this._lastFileSize < this.info.sizeLimit
    );
  }

  _maxSizeIsUnderLimit(): boolean {
    return (
      this._sizeIsUnderLimit() &&
      this._width >= this.info.startingWidth &&
      this._height >= this.info.startingHeight
    );
  }

  _sizeIsCloseEnough(): boolean {
    return (
      this._lastFileSize !== null &&
      this._lastFileSize > this.lowerBound &&
      this._lastFileSize < this.info.sizeLimit
    );
  }
}
