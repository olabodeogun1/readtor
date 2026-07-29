// ── AI generation rate limiting — 5 per 24 hours, tracked in localStorage ────

export const RATE_KEY    = "readtor_gen_timestamps";
export const RATE_LIMIT  = 5;
export const RATE_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in ms

function getGenTimestamps() {
  try { return JSON.parse(localStorage.getItem(RATE_KEY) || "[]"); } catch(e) { return []; }
}
function pruneTimestamps(ts) {
  const cutoff = Date.now() - RATE_WINDOW;
  return ts.filter(t => t > cutoff);
}
export function canGenerate() {
  return pruneTimestamps(getGenTimestamps()).length < RATE_LIMIT;
}
export function recordGeneration() {
  const ts = pruneTimestamps(getGenTimestamps());
  ts.push(Date.now());
  localStorage.setItem(RATE_KEY, JSON.stringify(ts));
}
export function generationsUsed() {
  return pruneTimestamps(getGenTimestamps()).length;
}
export function nextResetMs() {
  const ts = pruneTimestamps(getGenTimestamps());
  if (ts.length === 0) return 0;
  const oldest = Math.min(...ts);
  return Math.max(0, oldest + RATE_WINDOW - Date.now());
}
