// The real audio layer for a session, on expo-audio. See specs/.../004-session-playback/design.md.
//
// Between notes a silent track loops in "mix with others" mode: inaudible, leaves the
// athlete's music alone, and keeps the app alive with the screen locked. Around each note the
// mode switches to "duck others" and back.
import { Platform } from 'react-native';
import {
  createAudioPlayer, requestNotificationPermissionsAsync, setAudioModeAsync, setIsAudioActiveAsync,
  type AudioPlayer, type InterruptionMode,
} from 'expo-audio';
import type { AudioPort, PlayResult, SessionNote } from './session';

const silence = require('../../assets/silence.wav');

/** If a note never reports finishing, give up this long after it should have ended. */
const STUCK_NOTE_GRACE_MS = 15_000;

function setMode(interruptionMode: InterruptionMode) {
  return setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode });
}

export function createSessionAudio(cornerName: string): AudioPort {
  let keepAlive: AudioPlayer | null = null;
  let settleCurrent: ((result: PlayResult) => void) | null = null;

  /** Bring the athlete's own audio back to full volume and go back to waiting quietly. */
  async function restoreOtherAudio() {
    if (Platform.OS === 'ios') {
      // Deactivating with "notify others" is what ends ducking on iOS. It pauses our players,
      // so the silent loop is restarted straight after.
      await setIsAudioActiveAsync(false);
      await setMode('mixWithOthers');
      await setIsAudioActiveAsync(true);
      keepAlive?.play();
    } else {
      // Android: leaving the ducking mode abandons audio focus, which restores other apps.
      await setMode('mixWithOthers');
    }
  }

  return {
    async start() {
      await setIsAudioActiveAsync(true);
      await setMode('mixWithOthers');
      keepAlive = createAudioPlayer(silence, { keepAudioSessionActive: true });
      keepAlive.loop = true;
      if (Platform.OS === 'android') {
        // Android only keeps background playback going past a few minutes for a foreground
        // media service, which this starts. It shows a quiet media notification.
        try { await requestNotificationPermissionsAsync(); } catch { /* the service runs either way */ }
        keepAlive.setActiveForLockScreen(true, { title: 'Nopa', artist: 'Your people are with you', albumTitle: cornerName });
      }
      keepAlive.play();
    },

    async playNote(note: SessionNote) {
      await setMode('duckOthers');
      await setIsAudioActiveAsync(true); // re-activate so the new mode takes effect now

      const result = await new Promise<PlayResult>((resolve) => {
        const player = createAudioPlayer({ uri: note.uri });
        let done = false;
        const settle = (r: PlayResult) => {
          if (done) return;
          done = true;
          clearTimeout(guard);
          subscription.remove();
          settleCurrent = null;
          try { player.pause(); player.remove(); } catch { /* already gone */ }
          resolve(r);
        };
        const subscription = player.addListener('playbackStatusUpdate', (status) => {
          if (status.didJustFinish) settle('finished');
          else if (status.error) settle('failed');
        });
        const guard = setTimeout(() => settle('failed'), note.durationMs + STUCK_NOTE_GRACE_MS);
        settleCurrent = settle;
        player.play();
      });

      try { await restoreOtherAudio(); } catch { /* never let a restore problem lose the result */ }
      return result;
    },

    stopNote() {
      settleCurrent?.('stopped');
    },

    async stop() {
      settleCurrent?.('stopped');
      if (keepAlive) {
        try {
          keepAlive.pause();
          if (Platform.OS === 'android') keepAlive.clearLockScreenControls();
          keepAlive.remove();
        } catch { /* already gone */ }
        keepAlive = null;
      }
      try {
        await setIsAudioActiveAsync(false); // also un-ducks if we stopped mid-note
        await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false, interruptionMode: 'mixWithOthers' });
      } catch { /* nothing more to do */ }
    },
  };
}
