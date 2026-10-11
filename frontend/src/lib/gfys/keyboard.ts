const TEXT_ENTRY =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
const ACTIVATABLE = 'button, a[href], summary, [role="button"], [role="link"]';

/**
 * Whether a page-wide Gfys shortcut should leave this keydown alone. Text entry
 * owns every key; focused buttons and links only own the keys they activate on,
 * so arrows and letters keep working after a mouse click leaves a button focused.
 * Modified keys belong to the browser and OS (copy, tab switching, history).
 */
export function isShortcutBlocked(event: KeyboardEvent): boolean {
  if (
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.defaultPrevented
  ) {
    return true;
  }
  const target = event.target instanceof Element ? event.target : null;
  if (!target) {
    return false;
  }
  if (target.closest(TEXT_ENTRY)) {
    return true;
  }
  return (
    (event.key === ' ' || event.key === 'Enter') &&
    !!target.closest(ACTIVATABLE)
  );
}
