import type { Corner } from './corner';
import type { Kind, PlanSession, UsualWeek } from './plan';
import type { Streak } from './streak';
import { supabase } from './supabase';

const CORNER_COLUMNS = 'id, name, athlete_name, finish_date, share_token, created_at';

export async function listCorners(): Promise<Corner[]> {
  const { data, error } = await supabase.from('corners').select(CORNER_COLUMNS).order('finish_date');
  if (error) throw error;
  return data;
}

export async function createCorner(who: string, name: string, finishDate: string): Promise<Corner> {
  const { data, error } = await supabase
    .from('corners')
    .insert({ name, finish_date: finishDate, athlete_name: who })
    .select(CORNER_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export type NoteRow = {
  id: string;
  /** The session it was left for; null is "any time". */
  session_id: string | null;
  sender_name: string;
  audio_path: string;
  duration_ms: number;
  created_at: string;
  heard_at: string | null;
};

/** All notes in a corner, oldest first. */
export async function listNotes(cornerId: string): Promise<NoteRow[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('id, session_id, sender_name, audio_path, duration_ms, created_at, heard_at')
    .eq('corner_id', cornerId)
    .order('created_at');
  if (error) throw error;
  return data;
}

/** Short-lived download links for the athlete's own notes, in the same order as `paths`. */
export async function signedAudioUrls(paths: string[]): Promise<string[]> {
  const { data, error } = await supabase.storage.from('notes').createSignedUrls(paths, 3600);
  if (error) throw error;
  return data.map((d) => {
    if (d.error || !d.signedUrl) throw new Error('could not sign audio url');
    return d.signedUrl;
  });
}

/** The shared streak of one of the athlete's corners. */
export async function getCornerStreak(cornerId: string): Promise<Streak> {
  const { data, error } = await supabase.rpc('my_corner_streaks');
  if (error) throw error;
  const row = (data as { corner_id: string; streak_weeks: number; this_week_kept: boolean }[]).find((r) => r.corner_id === cornerId);
  return { streakWeeks: row?.streak_weeks ?? 0, thisWeekKept: row?.this_week_kept ?? false };
}

/** The corner's training sessions, earliest first. */
export async function listSessions(cornerId: string): Promise<PlanSession[]> {
  const { data, error } = await supabase.from('sessions').select('id, day, kind, minutes').eq('corner_id', cornerId).order('day');
  if (error) throw error;
  return data as PlanSession[];
}

export async function setSession(cornerId: string, day: string, kind: Kind, minutes: number): Promise<void> {
  const { error } = await supabase.rpc('set_session', { p_corner_id: cornerId, p_day: day, p_kind: kind, p_minutes: minutes });
  if (error) throw error;
}

export async function removeSession(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_session', { p_session_id: sessionId });
  if (error) throw error;
}

/** Fill the calendar from a usual week, starting today. */
export async function setUsualWeek(cornerId: string, week: UsualWeek, from: string): Promise<void> {
  const { error } = await supabase.rpc('set_usual_week', { p_corner_id: cornerId, p_week: week, p_from: from });
  if (error) throw error;
}
