// The plan and its calendar: pure helpers, no React Native imports.

export type Kind = 'easy' | 'hard' | 'long';
export type PlanSession = { id: string; day: string; kind: Kind; minutes: number };
export type PlanNote = { id: string; session_id: string | null; sender_name: string; created_at: string; heard_at: string | null };
/** Monday first. null is a rest day. */
export type UsualWeek = ({ kind: Kind; minutes: number } | null)[];

export const KINDS: Kind[] = ['easy', 'hard', 'long'];
export const KIND_TITLE: Record<Kind, string> = { easy: 'an easy one', hard: 'a hard one', long: 'a long one' };
export const USUAL_MINUTES: Record<Kind, number> = { easy: 30, hard: 45, long: 75 };
export const LENGTHS = [20, 30, 45, 60, 75, 90, 120, 180];
export const DEFAULT_WEEK: UsualWeek = [null, { kind: 'hard', minutes: 45 }, null, { kind: 'easy', minutes: 30 }, null, null, { kind: 'long', minutes: 75 }];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const pad = (n: number) => String(n).padStart(2, '0');
const parse = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };

/** Local calendar day as YYYY-MM-DD. */
export function isoDay(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function addDays(iso: string, n: number): string {
  const d = parse(iso); d.setDate(d.getDate() + n); return isoDay(d);
}
export function daysBetween(from: string, to: string): number {
  const a = parse(from), b = parse(to);
  return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86_400_000);
}
/** Monday = 0 … Sunday = 6. */
export function weekdayIndex(iso: string): number { return (parse(iso).getDay() + 6) % 7; }
export function dayOfMonth(iso: string): number { return parse(iso).getDate(); }

/** The days a calendar shows: whole weeks, starting on the Monday of today's week. */
export function calendarDays(today: string, weeks = 5): string[] {
  const start = addDays(today, -weekdayIndex(today));
  return Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));
}
/** "November" or "November – December" for the days shown. */
export function monthsShown(days: string[]): string {
  const a = parse(days[0]).getMonth(), b = parse(days[days.length - 1]).getMonth();
  return a === b ? MONTHS[a] : `${MONTHS[a]} – ${MONTHS[b]}`;
}
/** "Today", "Tomorrow", "Saturday", and from a week out "Saturday 5 December". */
export function dayLabel(iso: string, today: string): string {
  const n = daysBetween(today, iso), d = parse(iso);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  return n >= 2 && n < 7 ? DAYS[d.getDay()] : `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
/** "Saturday's hard one", "today's easy one". */
export function sessionPhrase(s: PlanSession, today: string): string {
  const label = dayLabel(s.day, today);
  return `${label === 'Today' || label === 'Tomorrow' ? label.toLowerCase() : label}'s ${KIND_TITLE[s.kind].replace(/^an? /, '')}`;
}
export function howLong(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return `${h === 1 ? '1 hour' : `${h} hours`}${m ? ` ${m}` : ''}`;
}
export function shortLong(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return `${h} h${m ? ` ${m}` : ''}`;
}
export function nameList(names: string[]): string {
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * The messages a session plays, oldest first: the unheard ones left for that day, the
 * "any time" ones, and any still unheard from an earlier day (skipped or cut short).
 */
export function notesForSession<N extends PlanNote>(session: PlanSession, sessions: PlanSession[], notes: N[]): N[] {
  const dayOf = new Map(sessions.map((s) => [s.id, s.day]));
  return notes
    .filter((n) => {
      if (n.heard_at) return false;
      if (n.session_id === null || n.session_id === session.id) return true;
      const day = dayOf.get(n.session_id);
      return day === undefined || day < session.day;
    })
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export type DayDots = { waiting: number; heard: number };

/**
 * What the athlete's calendar shows under each day: messages waiting on upcoming sessions
 * (carried-over and "any time" ones sit on the next session), and messages heard that day.
 */
export function dotsByDay(sessions: PlanSession[], notes: PlanNote[], today: string): Record<string, DayDots> {
  const out: Record<string, DayDots> = {};
  const at = (day: string) => (out[day] ??= { waiting: 0, heard: 0 });
  const upcoming = sessions.filter((s) => s.day >= today).sort((a, b) => a.day.localeCompare(b.day));
  const upcomingIds = new Set(upcoming.map((s) => s.id));
  for (const n of notes) {
    if (n.heard_at) { at(isoDay(new Date(n.heard_at))).heard++; continue; }
    if (n.session_id && upcomingIds.has(n.session_id)) at(upcoming.find((s) => s.id === n.session_id)!.day).waiting++;
    else if (upcoming.length) at(upcoming[0].day).waiting++;
  }
  return out;
}

/** One dot per week of the streak, oldest first; the last is this week (filled once kept). */
export function weekDots(streakWeeks: number, thisWeekKept: boolean): boolean[] {
  const before = Math.min(streakWeeks, 12) - (thisWeekKept ? 1 : 0);
  return [...Array.from({ length: Math.max(before, 0) }, () => true), thisWeekKept];
}

/** The streak in words. `who` is the athlete's first name on the supporter side; omit it for the athlete. */
export function togetherLines(streakWeeks: number, thisWeekKept: boolean, who?: string): { head: string; sub: string } {
  if (streakWeeks === 0) {
    return who
      ? { head: 'Be the first one there', sub: `One message from you and ${who} is not doing this alone.` }
      : { head: 'No one yet', sub: 'Send your link to the people close to you.' };
  }
  const head = streakWeeks === 1 ? 'One week side by side' : `${streakWeeks} weeks side by side`;
  const every = streakWeeks === 1 ? 'this week' : `every week for ${streakWeeks} weeks`;
  if (!who) return { head, sub: thisWeekKept ? `Someone has been with you ${every}.` : `Someone has been with you ${every}. This week is still open.` };
  return {
    head,
    sub: thisWeekKept
      ? `Someone has been there for ${who} ${every}${streakWeeks === 1 ? '' : ', this week too'}.`
      : `Someone has been there for ${who} ${every}. This week is still open. Will it be you?`,
  };
}

export function waitingLine(n: number): string {
  return n === 0 ? 'No one has left a message here yet.' : n === 1 ? 'One message is waiting for you.' : `${n} messages are waiting for you.`;
}
