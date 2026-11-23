// Pure helpers for corners. No React Native imports, so they run under `node --test`.

export type Corner = {
  id: string;
  name: string;
  finish_date: string; // YYYY-MM-DD
  share_token: string;
  created_at: string;
};

export type CornerInput = { name: string; day: string; month: string; year: string };

export type CornerValidation =
  | { ok: true; name: string; finishDate: string }
  | { ok: false; error: string };

const pad = (n: number) => String(n).padStart(2, '0');

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Check the create form. `today` is the athlete's local date. */
export function validateCorner(input: CornerInput, today: Date = new Date()): CornerValidation {
  const name = input.name.trim();
  if (!name) return { ok: false, error: 'Give your goal a name.' };
  if (name.length > 80) return { ok: false, error: 'That name is a little long. Keep it under 80 characters.' };

  if (!input.day.trim() || !input.month.trim() || !input.year.trim()) {
    return { ok: false, error: 'Add the finish date: day, month and year.' };
  }
  const [day, month, year] = [input.day, input.month, input.year].map((v) => Number(v.trim()));
  const date = new Date(year, month - 1, day);
  const real =
    Number.isInteger(day) && Number.isInteger(month) && Number.isInteger(year) &&
    year >= 1000 && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  if (!real) return { ok: false, error: "That date doesn't exist. Check the day, month and year." };

  const finishDate = `${year}-${pad(month)}-${pad(day)}`;
  if (finishDate < toIsoDate(today)) return { ok: false, error: 'The finish date has already passed. Pick today or later.' };
  return { ok: true, name, finishDate };
}

/** The link an athlete sends to their people. */
export function shareLink(supporterUrl: string, shareToken: string): string {
  return `${supporterUrl.replace(/\/+$/, '')}/?c=${encodeURIComponent(shareToken)}`;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2027-09-26" -> "26 September 2027" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Whole days from today until the finish date (0 on the day, negative after). */
export function daysUntil(iso: string, today: Date = new Date()): number {
  const [y, m, d] = iso.split('-').map(Number);
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((Date.UTC(y, m - 1, d) - a) / 86_400_000);
}
