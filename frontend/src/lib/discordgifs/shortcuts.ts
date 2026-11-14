/** Editor commands bound to keys, ported from Gif Studio's keyboard handler. */
export type ClipShortcut =
  | 'togglePlay'
  | 'previousFrame'
  | 'nextFrame'
  | 'backOneSecond'
  | 'forwardOneSecond'
  | 'setStart'
  | 'setEnd'
  | 'jumpToStart'
  | 'jumpToEnd'
  | 'convert'
  | 'openFile';

/** Input types that take no typed text, so plain keys stay shortcuts on them. */
const nonTextInputs = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
]);

/** Keys a focused slider uses to move itself. */
const sliderKeys = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]);

/**
 * Controls Space activates. Text inputs never reach this check, so any
 * remaining input is a checkbox, radio, button or file input.
 */
const activatable =
  'button, a[href], summary, input:not([type="range"]), [role="button"], [role="link"], [role="switch"], [role="checkbox"], [role="radio"], [role="tab"]';

/**
 * Marks a focusable control whose activation does nothing, such as a crop
 * handle, so Space still plays while it holds focus after a drag.
 */
export const passesShortcuts = { 'data-passes-shortcuts': '' };

function isTypingTarget(element: Element) {
  if (element instanceof HTMLInputElement)
    return !nonTextInputs.has(element.type);
  return (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement ||
    (element instanceof HTMLElement && element.isContentEditable)
  );
}

/**
 * Maps a keydown to an editor command, or null when the key belongs to
 * something else: a field being typed in, a focused slider or crop handle
 * (they mark arrow keys as handled), Space on a focused button or switch
 * (normal keyboard activation wins, as in Gfys), or a held key that must not
 * repeat.
 */
export function clipShortcutFor(event: KeyboardEvent): ClipShortcut | null {
  if (event.defaultPrevented || event.altKey) return null;
  const target = event.target instanceof Element ? event.target : null;
  if (target && isTypingTarget(target)) return null;
  // Holding an arrow keeps stepping; holding anything else must not toggle
  // playback or start conversions over and over.
  const repeatable = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
  if (event.repeat && !repeatable) return null;
  if (event.ctrlKey || event.metaKey) {
    if (event.shiftKey) return null;
    if (event.key === 'Enter') return 'convert';
    if (event.key === 'o' || event.key === 'O') return 'openFile';
    return null;
  }
  if (
    target?.closest('[role="slider"], input[type="range"]') &&
    sliderKeys.has(event.key)
  )
    return null;
  switch (event.key) {
    case ' ': {
      const control = target?.closest(activatable);
      return control && !control.hasAttribute('data-passes-shortcuts')
        ? null
        : 'togglePlay';
    }
    case 'ArrowLeft':
      return event.shiftKey ? 'backOneSecond' : 'previousFrame';
    case 'ArrowRight':
      return event.shiftKey ? 'forwardOneSecond' : 'nextFrame';
    case 'i':
    case 'I':
      return 'setStart';
    case 'o':
    case 'O':
      return 'setEnd';
    case 'Home':
      return 'jumpToStart';
    case 'End':
      return 'jumpToEnd';
    default:
      return null;
  }
}
