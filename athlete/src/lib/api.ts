import type { Corner } from './corner';
import { supabase } from './supabase';

const CORNER_COLUMNS = 'id, name, finish_date, share_token, created_at';

export async function listCorners(): Promise<Corner[]> {
  const { data, error } = await supabase.from('corners').select(CORNER_COLUMNS).order('finish_date');
  if (error) throw error;
  return data;
}

export async function createCorner(name: string, finishDate: string): Promise<Corner> {
  const { data, error } = await supabase
    .from('corners')
    .insert({ name, finish_date: finishDate })
    .select(CORNER_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export type NoteRow = {
  id: string;
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
    .select('id, sender_name, audio_path, duration_ms, created_at, heard_at')
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
