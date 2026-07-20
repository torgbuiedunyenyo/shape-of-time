/**
 * Failure copy for reading surfaces. Machine text — contract codes, ledger details, fetch
 * errors — must never be rendered on a page a reader sees; failures wear the book's own voice.
 * The raw detail stays in component state and the network tab for operators.
 */

export function folioCompositionFailureCopy(ordinal: number, retryable: boolean): string {
  const subject = ordinal >= 1 ? `Folio ${ordinal}` : "The next folio";
  return retryable
    ? `${subject} could not be composed just now. This page remains yours; you may try again in a moment.`
    : `${subject} rests unwritten. This page remains yours.`;
}

export function creationFailureCopy(): string {
  return (
    "The new book could not be composed just now. Nothing was created; " +
    "you may close this window or try again."
  );
}
