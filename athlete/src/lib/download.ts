// Fetch a session's audio before it starts, so playback needs no network.
import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import { signedAudioUrls, type NoteRow } from './api';
import type { SessionNote } from './session';

export async function downloadNotes(notes: NoteRow[]): Promise<SessionNote[]> {
  if (notes.length === 0) return [];
  const urls = await signedAudioUrls(notes.map((n) => n.audio_path));

  let dir: Directory | null = null;
  if (Platform.OS !== 'web') {
    dir = new Directory(Paths.cache, 'nopa-notes');
    dir.create({ idempotent: true, intermediates: true });
  }

  return Promise.all(
    notes.map(async (n, i) => {
      let uri: string;
      if (dir) {
        const file = await File.downloadFileAsync(urls[i], new File(dir, `${n.id}.wav`), { idempotent: true });
        uri = file.uri;
      } else {
        // Web build (used for the end-to-end tests): keep the audio in memory.
        const res = await fetch(urls[i]);
        if (!res.ok) throw new Error('download failed');
        uri = URL.createObjectURL(await res.blob());
      }
      return { id: n.id, senderName: n.sender_name, uri, durationMs: n.duration_ms };
    }),
  );
}
