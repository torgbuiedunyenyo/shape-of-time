import { useEffect, useRef, useState } from "react";

import { creationFailureCopy } from "./content/composure.js";

interface CreationDialogProps {
  kind: "selection" | "title";
  source: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function CreationDialog({ kind, source, onClose, onConfirm }: CreationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<
    | { phase: "confirm" }
    | { phase: "preparing" }
    | { message: string; phase: "error" }
  >({ phase: "confirm" });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    dialog.showModal();
    confirmRef.current?.focus();
    return () => dialog.close();
  }, []);

  const create = async () => {
    if (state.phase === "preparing") return;
    setState({ phase: "preparing" });
    try {
      await onConfirm();
    } catch (error) {
      setState({
        message: error instanceof Error ? error.message : String(error),
        phase: "error",
      });
    }
  };

  return (
    <dialog
      aria-busy={state.phase === "preparing"}
      aria-describedby="creation-explanation"
      aria-labelledby="creation-title"
      className="creation-dialog"
      onCancel={(event) => {
        event.preventDefault();
        if (state.phase !== "preparing") onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = [...event.currentTarget.querySelectorAll<HTMLElement>(
          "button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex='-1'])",
        )].filter((control) => control.getAttribute("aria-hidden") !== "true");
        const first = controls[0];
        const last = controls.at(-1);
        if (first === undefined || last === undefined) return;
        if (controls.length === 1 || (event.shiftKey && document.activeElement === first)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && state.phase !== "preparing") onClose();
      }}
      ref={dialogRef}
    >
      <section onMouseDown={(event) => event.stopPropagation()}>
        <p className="eyebrow">A book latent here</p>
        <h2 id="creation-title">{kind === "selection" ? "Open this passage" : "Create this title"}</h2>
        <blockquote>{source}</blockquote>
        <p aria-live="polite" id="creation-explanation">
          {state.phase === "confirm"
            ? "This will compose the first folio of a new book. Nothing is generated until you confirm."
            : state.phase === "preparing"
              ? "Composing the new book’s first folio. Your current page remains open behind this window."
              : creationFailureCopy()}
        </p>
        <div className="dialog-actions">
          {state.phase === "preparing" ? null : (
            <button className="secondary-action" onClick={onClose} type="button">Close</button>
          )}
          {state.phase === "confirm" ? (
            <button className="primary-action" onClick={() => void create()} ref={confirmRef} type="button">
              Open the new book
            </button>
          ) : null}
        </div>
      </section>
    </dialog>
  );
}
