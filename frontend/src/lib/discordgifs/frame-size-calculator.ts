import { ScaleCalculationConfig } from './conversion-target';

export class FrameSizeCalculator {
  info: ScaleCalculationConfig;
  _changeSize: number;
  _width: number;
  _sizeComparisons: Array<number>;
  _lastFileSize: number | null;
  _isDone: boolean;
  _lossNormalizer: LossNormalizer;

  constructor(info: ScaleCalculationConfig) {
    this.info = info;
    this._changeSize = info.changeSize;
    this._width = info.startingWidth;
    this._sizeComparisons = [0, 0];
    this._lastFileSize = null;
    this._isDone = false;
    this._lossNormalizer = new LossNormalizer(0);
  }

  get lowerBound() {
    return this.info.sizeLimit * (1 - this.info.sizeMargin);
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
   * Calculates the new scale width based on the given file size.
   *
   * @param fileSize - The size of the file.
   * @returns The new scale width or null if the width was not changed
   */
  getNewWidth(fileSize: number): number | null {
    if (this.isDone || this._lastFileSize === fileSize) {
      return null;
    }

    this._updateFileSizeAndComparisons(fileSize);

    if (this._maxSizeIsUnderLimit() || this._sizeIsCloseEnough()) {
      this._isDone = true;
      return null;
    }

    if (this._changeDirectionFlipped()) {
      this._changeSize = this._reducedChangeSize();
    }

    if (this.changeSize === this.info.minChangeSize) {
      if (this._sizeIsUnderLimit()) {
        this._isDone = true;
        return null;
      }
      return this._reduceSize() ? this.width : null;
    }

    if (this._sizeIsUnderLimit()) {
      return this._increaseSize() ? this.width : null;
    } else {
      return this._reduceSize() ? this.width : null;
    }
  }

  get width(): number {
    return this._width;
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
    this._width = Math.max(this._width - this.changeSize, this.info.minWidth);
    if (this._width === oldWidth) {
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
    this._width = Math.min(
      this._width + this.changeSize,
      this.info.startingWidth
    );

    if (this._width === oldWidth) {
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

  _reducedChangeSize() {
    return this._calculateChangeSizeBasedOnFileSize(
      this.changeSize,
      this._lastFileSize,
      this.info.sizeLimit,
      this.info.minChangeSize
    );
  }

  _calculateChangeSizeBasedOnFileSize(
    changeSize: number,
    fileSize: null | number,
    limit: number,
    minChangeSize: number
  ): number {
    let bias;
    const divideBy = 2.5;
    if (!fileSize) {
      return changeSize;
    } else {
      const diff = fileSize - limit;
      // big bias = file size is way off, don't reduce change size by alot
      // small bias = file size is close, reduce change size by a bigger value
      bias = diff / limit;
      // the cap on the higher end is smaller to avoid big size fluctuations
      bias = Math.min(bias, 1.0);
      bias = Math.max(bias, -1.3);
    }

    changeSize = Math.max(
      Math.round(changeSize / (divideBy - bias)),
      minChangeSize
    );
    return changeSize;
  }

  _calculateChangeSizeBasedOnFileSizev0(
    changeSize: number,
    fileSize: null | number,
    limit: number,
    minChangeSize: number
  ): number {
    if (!fileSize) {
      return changeSize;
    }
    let loss = (fileSize - limit) * (fileSize - limit);
    loss = this._lossNormalizer.normalize(loss);
    changeSize = Math.max(
      Math.round((changeSize / 1.25) * loss),
      minChangeSize
    );
    return changeSize;
  }

  _sizeIsUnderLimit(): boolean {
    return (
      this._lastFileSize !== null && this._lastFileSize < this.info.sizeLimit
    );
  }

  _maxSizeIsUnderLimit(): boolean {
    return this._sizeIsUnderLimit() && this._width >= this.info.startingWidth;
  }

  _sizeIsCloseEnough(): boolean {
    return (
      this._lastFileSize !== null &&
      this._lastFileSize > this.lowerBound &&
      this._lastFileSize < this.info.sizeLimit
    );
  }
}

class LossNormalizer {
  minLoss: number;
  maxLoss: number;

  constructor(initialValue: number = 0) {
    this.minLoss = initialValue;
    this.maxLoss = initialValue;
  }

  normalize(value: number): number {
    if (value < this.minLoss) this.minLoss = value;
    if (value > this.maxLoss) this.maxLoss = value;

    // prevent division by zero if all values are the same
    if (this.minLoss === this.maxLoss) return 0;

    return (value - this.minLoss) / (this.maxLoss - this.minLoss);
  }

  reset(initialValue: number = 0) {
    this.minLoss = initialValue;
    this.maxLoss = initialValue;
  }
}
