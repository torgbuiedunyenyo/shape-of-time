import { useEffect, useRef } from "react";

interface DisconnectedCreationDialogProps {
  kind: "selection" | "title";
  source: string;
  onClose: () => void;
}

export function DisconnectedCreationDialog({
  kind,
  source,
  onClose,
}: DisconnectedCreationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    dialog.showModal();
    closeRef.current?.focus();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      aria-describedby="creation-explanation"
      aria-labelledby="creation-title"
      className="creation-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
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
        if (event.target === event.currentTarget) onClose();
      }}
      ref={dialogRef}
    >
      <section onMouseDown={(event) => event.stopPropagation()}>
        <p className="eyebrow">A book latent here</p>
        <h2 id="creation-title">{kind === "selection" ? "Open this passage" : "Create this title"}</h2>
        <blockquote>{source}</blockquote>
        <p id="creation-explanation">
          Dynamic book creation is deliberately disconnected while this reader is being judged. No
          book was created and no request was sent.
        </p>
        <button className="primary-action" onClick={onClose} ref={closeRef} type="button">
          Close
        </button>
      </section>
    </dialog>
  );
}
