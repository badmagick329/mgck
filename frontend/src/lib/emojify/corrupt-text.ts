import { randomBetween, randomChoice } from '@/lib/utils';

export class CorruptText {
  _original: string;
  _alphaIndices: number[];
  _text: string;
  _corruptionIndices: number[];
  _numberOfCorruptions: number;

  get original(): string {
    return this._original;
  }

  get text(): string {
    return this._text;
  }

  get corruptionIndices(): number[] {
    return this._corruptionIndices;
  }

  public static createFrom(
    original: string,
    numberOfCorruptions: number
  ): CorruptText {
    const indices = CorruptText._calcAlphaIndices(original);
    const created = new CorruptText(original, indices, numberOfCorruptions);
    created._initCorruptedText();

    return created;
  }

  private constructor(
    original: string,
    alphaIndices: number[],
    numberOfCorruptions: number
  ) {
    this._original = original;
    this._alphaIndices = alphaIndices;
    this._numberOfCorruptions = numberOfCorruptions;
    this._text = '';
    this._corruptionIndices = [];
  }

  private static _calcAlphaIndices(text: string): number[] {
    return text.split('').reduce((acc, char, i) => {
      if (char.match(/[a-zA-Z]/)) {
        acc.push(i);
      }
      return acc;
    }, [] as number[]);
  }

  private _initCorruptedText(): void {
    this._numberOfCorruptions = Math.max(
      0,
      Math.min(this._numberOfCorruptions, this._alphaIndices.length)
    );

    if (this._numberOfCorruptions === 0) {
      this._text = this._original;
      return;
    }

    const corruptionIndices = this._calculateCorruptionIndices();
    this._corruptionIndices = corruptionIndices;

    const corrupted = this._original.split('').map((char, i) => {
      if (corruptionIndices.includes(i)) {
        const casing = char === char.toUpperCase() ? 'upper' : 'lower';
        return this._randomAlphaLetter(char, casing);
      }
      return char;
    });

    this._text = corrupted.join('');
  }

  private _calculateCorruptionIndices(): number[] {
    if (this._alphaIndices.length === 0) {
      return [];
    }

    const shuffledIndices = [...this._alphaIndices];

    for (let i = shuffledIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledIndices[i], shuffledIndices[j]] = [
        shuffledIndices[j],
        shuffledIndices[i],
      ];
    }

    return shuffledIndices
      .slice(0, this._numberOfCorruptions)
      .sort((a, b) => a - b);
  }

  private _randomAlphaLetter(omit: string, casing: 'upper' | 'lower'): string {
    const letters = 'abcdefghijklmnopqrstuvwxyz'
      .split('')
      .filter((letter) => letter !== omit.toLocaleLowerCase());

    const letter = randomChoice(letters);
    return casing === 'lower' ? letter : letter.toUpperCase();
  }
}

export class CorruptTextSegments {
  _corruptText: CorruptText;
  _segments: string[];

  constructor(corruptText: CorruptText) {
    this._corruptText = corruptText;
    this._segments = this._extract();
  }

  public createTypingSequence(
    correctionDelayMin = 100,
    correctionDelayMax = 500
  ): Array<string | number> {
    const sequence = [] as (string | number)[];

    for (let i = 0; i < this._segments.length; i++) {
      sequence.push(this._segments[i]);
      if (i < this._segments.length - 1) {
        sequence.push(randomBetween(correctionDelayMin, correctionDelayMax));
      }
    }

    return sequence;
  }

  private _extract(): string[] {
    const segments = [] as string[];

    if (this._corruptText.corruptionIndices.length === 0) {
      return [this._corruptText.original];
    }

    const original = this._corruptText.original;
    const corrupted = this._corruptText.text;
    const corruptIndices = [...this._corruptText.corruptionIndices];

    for (let i = 0; i < corruptIndices.length + 1; i++) {
      let segment = '';
      let corruptionShouldBeShown = false;

      for (let charIndex = 0; charIndex < original.length; charIndex++) {
        if (!corruptIndices.includes(charIndex)) {
          segment += original[charIndex];
          continue;
        }

        const corruptionPosition = corruptIndices.indexOf(charIndex);
        corruptionShouldBeShown = corruptionPosition >= i;

        if (corruptionShouldBeShown) {
          segment += corrupted[charIndex];
          break;
        }

        segment += original[charIndex];
      }

      segments.push(segment);
    }
    return segments;
  }
}
