const key = "shape-of-time-reading-guide-v1";
let seenInThisVisit = false;
export function hasSeenReadingGuide() {
  try { return seenInThisVisit || localStorage.getItem(key) === "seen"; }
  catch { return seenInThisVisit; }
}
export function rememberReadingGuide() {
  seenInThisVisit = true;
  try { localStorage.setItem(key, "seen"); } catch { /* The guide remains dismissible without storage. */ }
}
