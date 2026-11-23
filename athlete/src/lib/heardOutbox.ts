// On-device outbox for "heard" marks. A mark is saved first, then sent; anything that could
// not be sent (no signal mid-run) is retried later with its original time.
// No React Native imports: storage and sending are passed in (see heard.ts for the real ones).

export type HeardMark = { noteId: string; heardAt: string };

export type OutboxDeps = {
  load: () => Promise<HeardMark[]>;
  save: (marks: HeardMark[]) => Promise<void>;
  /** Send one mark. 'ok': stored. 'gone': the server refused it for good. Throws: try later. */
  send: (mark: HeardMark) => Promise<'ok' | 'gone'>;
};

export function createHeardOutbox(deps: OutboxDeps) {
  let marks: HeardMark[] | null = null;
  let queue: Promise<unknown> = Promise.resolve();

  /** Run one operation at a time, so saves never interleave. */
  function serial<T>(work: () => Promise<T>): Promise<T> {
    const run = queue.then(work, work);
    queue = run.catch(() => undefined);
    return run;
  }

  async function all(): Promise<HeardMark[]> {
    if (marks === null) {
      try { marks = await deps.load(); } catch { marks = []; }
    }
    return marks;
  }

  return {
    /** Remember that a note was heard. Safe to call twice for the same note: first time wins. */
    add(noteId: string, heardAt: Date): Promise<void> {
      return serial(async () => {
        const current = await all();
        if (current.some((m) => m.noteId === noteId)) return;
        marks = [...current, { noteId, heardAt: heardAt.toISOString() }];
        await deps.save(marks);
      });
    },

    /** Try to send everything waiting. Returns how many are still waiting. */
    flush(): Promise<number> {
      return serial(async () => {
        for (const mark of [...(await all())]) {
          let done = false;
          try {
            await deps.send(mark); // 'ok' and 'gone' both mean: stop trying
            done = true;
          } catch {
            // no signal or server trouble: keep it for next time
          }
          if (done) {
            marks = (marks ?? []).filter((m) => m.noteId !== mark.noteId);
            await deps.save(marks);
          }
        }
        return (marks ?? []).length;
      });
    },

    /** Ids of notes heard on this phone whose mark has not reached the server yet. */
    async pendingIds(): Promise<string[]> {
      return (await all()).map((m) => m.noteId);
    },
  };
}
