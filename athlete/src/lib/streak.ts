// Words for the shared corner streak. Pure, so it runs under `node --test`.
// One streak for the whole corner; there are no per-person numbers to show.

export type Streak = { streakWeeks: number; thisWeekKept: boolean };

export function streakLines(s: Streak): { headline: string; detail: string } {
  if (s.streakWeeks === 0) {
    return {
      headline: 'Your corner is just getting started',
      detail: 'The first note in a week starts a streak your people share.',
    };
  }
  return {
    headline: s.streakWeeks === 1 ? 'Your corner has shared 1 week' : `Your corner has shared ${s.streakWeeks} weeks in a row`,
    detail: s.thisWeekKept ? 'This week is already part of it.' : 'A note from anyone this week keeps it going.',
  };
}
