import { RefObject, useEffect, useRef } from 'react';
import { ClipShortcut, clipShortcutFor } from '@/lib/discordgifs/shortcuts';

type Handlers = Partial<Record<ClipShortcut, () => void>>;

/**
 * Listens on the window, as Gif Studio does, so shortcuts work after a click
 * on the page background as well as from inside a clip card.
 *
 * With a `scope`, keys count only when focus is on the page itself or inside
 * that element: a key pressed on the dropzone, a preset card or another clip
 * card is never taken over by this one.
 */
export function useClipShortcuts(
  handlers: Handlers,
  { enabled = true, scope }: { enabled?: boolean; scope?: RefObject<Element> }
) {
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const shortcut = clipShortcutFor(event);
      const handler = shortcut && latest.current[shortcut];
      if (!handler) return;
      if (scope) {
        const target = event.target;
        const onPage =
          target === document.body || target === document.documentElement;
        if (
          !onPage &&
          !(target instanceof Node && scope.current?.contains(target))
        )
          return;
      }
      // Also stops Ctrl+Enter from clicking the focused button, Home and End
      // from scrolling, and Ctrl+O from opening the browser's own file dialog.
      event.preventDefault();
      handler();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, scope]);
}
