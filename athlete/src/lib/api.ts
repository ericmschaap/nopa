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
