import * as React from 'react';

export interface FilePickerOptions {
  /** File types the picker offers, as in <input accept>, e.g. ".json,application/json". */
  accept?: string;
  /** Lets the user pick several files at once. */
  multiple?: boolean;
  /** Called with the picked files; not called when the user cancels. */
  onPick: (files: File[]) => void;
}

export interface FilePicker {
  /** Opens the browser's file picker. Call it straight from a click handler (Button onClick, Menu item onSelect) so
   *  the browser sees the user's gesture. */
  open: () => void;
}

/** Opens the browser's file picker from any button or menu item, without a drop area: { open }. The hook keeps its
 *  own hidden <input type="file"> (created on the first open, removed on unmount), so the page renders no native
 *  control. Safe on the server: nothing touches the document until open() is called. */
export function useFilePicker({ accept, multiple, onPick }: FilePickerOptions): FilePicker {
  const input = React.useRef<HTMLInputElement | null>(null);
  // The latest options, read when the picker opens and when files arrive.
  const opts = React.useRef({ accept, multiple, onPick });
  React.useLayoutEffect(() => {
    opts.current = { accept, multiple, onPick };
  });
  React.useEffect(
    () => () => {
      input.current?.remove();
      input.current = null;
    },
    [],
  );
  const open = React.useCallback(() => {
    let el = input.current;
    if (!el) {
      el = document.createElement('input');
      el.type = 'file';
      el.hidden = true;
      el.tabIndex = -1;
      el.setAttribute('aria-hidden', 'true');
      el.addEventListener('change', () => {
        const target = input.current;
        if (!target) return;
        const files = Array.from(target.files ?? []);
        // Cleared so picking the same file again still reports it.
        target.value = '';
        if (files.length) opts.current.onPick(files);
      });
      // In the document: some browsers open the picker only for an input that is attached.
      document.body.appendChild(el);
      input.current = el;
    }
    const { accept: a, multiple: m } = opts.current;
    if (a) el.setAttribute('accept', a);
    else el.removeAttribute('accept');
    el.toggleAttribute('multiple', !!m);
    el.click();
  }, []);
  return React.useMemo(() => ({ open }), [open]);
}
