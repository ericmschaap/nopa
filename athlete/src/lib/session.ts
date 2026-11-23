// The session engine: decides when each note plays. No React Native imports; audio and the
// clock are passed in, so the rules are unit-tested with fakes (session.test.ts).
import { planOffsets } from './schedule.ts';

export type SessionNote = {
  id: string;
  senderName: string;
  /** Local audio, already downloaded. */
  uri: string;
  durationMs: number;
};

export type PlayResult = 'finished' | 'stopped' | 'failed';

/** What the engine needs from the audio layer (see audio.ts for the real one). */
export interface AudioPort {
  /** Begin the session's background audio (silent keep-alive). */
  start(): Promise<void>;
  /** Duck other audio, play the note, restore. Resolves when the note is over. */
  playNote(note: SessionNote): Promise<PlayResult>;
  /** Cut the current note short; its playNote resolves 'stopped'. */
  stopNote(): void;
  /** End all session audio. */
  stop(): Promise<void>;
}

export type SessionState = {
  status: 'idle' | 'running' | 'ended';
  startedAt: number | null;
  durationMs: number;
  /** Due time of each note, ms from start, same order as `notes`. */
  offsets: number[];
  notes: SessionNote[];
  /** Index of the next note that has not started yet. */
  nextIndex: number;
  playing: SessionNote | null;
  /** Ids of notes that played to the end. */
  playedIds: string[];
  /** True when every note played and the session closed by itself. */
  completed: boolean;
};

export type SessionOptions = {
  notes: SessionNote[];
  durationMs: number;
  audio: AudioPort;
  now?: () => number;
  /** Called when a note has played to the end, with the moment it finished. */
  onNotePlayed?: (note: SessionNote, finishedAt: Date) => void;
  onChange?: (state: SessionState) => void;
  /** Set false in tests to drive tick() by hand. */
  autoTick?: boolean;
};

export class Session {
  private state: SessionState;
  private readonly audio: AudioPort;
  private readonly now: () => number;
  private readonly onNotePlayed?: SessionOptions['onNotePlayed'];
  private readonly onChange?: SessionOptions['onChange'];
  private readonly autoTick: boolean;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(options: SessionOptions) {
    this.audio = options.audio;
    this.now = options.now ?? Date.now;
    this.onNotePlayed = options.onNotePlayed;
    this.onChange = options.onChange;
    this.autoTick = options.autoTick ?? true;
    this.state = {
      status: 'idle', startedAt: null, durationMs: options.durationMs,
      offsets: planOffsets(options.notes.length, options.durationMs),
      notes: options.notes, nextIndex: 0, playing: null, playedIds: [], completed: false,
    };
  }

  getState(): SessionState {
    return this.state;
  }

  private set(patch: Partial<SessionState>) {
    this.state = { ...this.state, ...patch };
    this.onChange?.(this.state);
  }

  async start(): Promise<void> {
    if (this.state.status !== 'idle') return;
    await this.audio.start();
    this.set({ status: 'running', startedAt: this.now() });
    if (this.autoTick) this.timer = setInterval(() => void this.tick(), 1000);
  }

  /** Play the next note if it is due and nothing else is playing. Safe to call any time. */
  async tick(): Promise<void> {
    const s = this.state;
    if (s.status !== 'running' || s.playing || s.startedAt === null) return;
    if (s.nextIndex >= s.notes.length) return;
    if (this.now() - s.startedAt < s.offsets[s.nextIndex]) return;

    const note = s.notes[s.nextIndex];
    this.set({ playing: note, nextIndex: s.nextIndex + 1 });
    let result: PlayResult;
    try {
      result = await this.audio.playNote(note);
    } catch {
      result = 'failed';
    }
    if (result === 'finished') {
      this.set({ playedIds: [...this.state.playedIds, note.id] });
      this.onNotePlayed?.(note, new Date(this.now()));
    }
    if (this.state.status !== 'running') return; // ended while the note was playing
    this.set({ playing: null });

    if (this.state.nextIndex >= this.state.notes.length) {
      await this.finish(true);
    } else {
      await this.tick(); // a note that fell due meanwhile plays straight after
    }
  }

  /** End early. Notes that have not played to the end stay unheard. */
  async end(): Promise<void> {
    await this.finish(false);
  }

  private async finish(completed: boolean): Promise<void> {
    if (this.state.status === 'ended') return;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const wasPlaying = this.state.playing !== null;
    this.set({ status: 'ended', playing: null, completed });
    if (wasPlaying) this.audio.stopNote();
    await this.audio.stop();
  }
}
