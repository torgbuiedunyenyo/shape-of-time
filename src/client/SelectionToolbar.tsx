import type { StableSelection } from "./reader/reader-state.js";

interface SelectionToolbarProps {
  selection: StableSelection;
  onOpen: () => void;
  onDismiss: () => void;
}

export function SelectionToolbar({ selection, onOpen, onDismiss }: SelectionToolbarProps) {
  return (
    <div
      aria-label="Selected passage actions"
      aria-live="polite"
      className="selection-toolbar"
      role="toolbar"
    >
      <p title={selection.quote}>
        <span aria-hidden="true">“</span>
        {selection.quote}
        <span aria-hidden="true">”</span>
      </p>
      <button className="primary-action" onClick={onOpen} type="button">
        Open as a book
      </button>
      <button aria-label="Dismiss selected passage" className="icon-action" onClick={onDismiss} type="button">
        ×
      </button>
    </div>
  );
}
