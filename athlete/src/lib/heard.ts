// The real heard outbox: kept in device storage, sent through mark_note_heard.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createHeardOutbox, type HeardMark } from './heardOutbox';
import { supabase } from './supabase';

const KEY = 'nopa.heardOutbox.v1';

export const heardOutbox = createHeardOutbox({
  load: async () => JSON.parse((await AsyncStorage.getItem(KEY)) ?? '[]') as HeardMark[],
  save: (marks) => AsyncStorage.setItem(KEY, JSON.stringify(marks)),
  send: async (mark) => {
    const { error } = await supabase.rpc('mark_note_heard', { p_note_id: mark.noteId, p_heard_at: mark.heardAt });
    if (!error) return 'ok';
    // The note is gone or is not ours: retrying will never help.
    if (error.code === 'P0002' || error.code === '42501') return 'gone';
    throw error;
  },
});
