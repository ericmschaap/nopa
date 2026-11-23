// Pure spacing maths for a session. No React Native imports.

/**
 * When each note is due, in ms from the start of the session.
 * N notes in duration D are due at D × i / (N + 1) for i = 1..N: evenly spread, nothing at
 * the start, nothing at the very end.
 */
export function planOffsets(noteCount: number, durationMs: number): number[] {
  if (noteCount <= 0 || durationMs <= 0) return [];
  return Array.from({ length: noteCount }, (_, i) => Math.round((durationMs * (i + 1)) / (noteCount + 1)));
}

/** Rough durations the athlete can pick, in minutes. */
export const DURATION_CHOICES_MIN = [20, 30, 45, 60, 90, 120];

/** "in 12 min", "in under a minute" */
export function describeWait(ms: number): string {
  if (ms <= 60_000) return 'in under a minute';
  const min = Math.round(ms / 60_000);
  return `in about ${min} min`;
}
