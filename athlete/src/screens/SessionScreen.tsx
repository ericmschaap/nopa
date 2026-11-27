import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { nameList } from '../lib/plan';
import type { Session, SessionState } from '../lib/session';
import { Body, Button, Title } from '../ui/kit';
import { fonts, useTheme } from '../ui/theme';

const mmss = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const wait = (ms: number) => (ms <= 90_000 ? `in ${mmss(ms)}` : `in about ${Math.round(ms / 60_000)} minutes`);

export function SessionScreen(props: { label: string; session: Session; state: SessionState; onDone: () => void }) {
  const t = useTheme();
  const { state } = props;
  const [, setNow] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (state.status === 'ended') {
    const heard = state.notes.filter((n) => state.playedIds.includes(n.id)).map((n) => n.senderName);
    const left = state.notes.length - heard.length;
    return (
      <View style={{ gap: 26 }}>
        <Title>{state.completed ? 'That was everyone' : 'Session ended'}</Title>
        <Body testID="session-summary">
          {heard.length ? `${nameList(heard)} ${heard.length === 1 ? 'was' : 'were'} with you today.` : 'No one got to say hello this time.'}
          {left > 0 ? ` ${left === 1 ? 'One message is' : `${left} messages are`} saved for next time.` : ''}
        </Body>
        <Button label="Back to the calendar" kind="main" onPress={props.onDone} />
      </View>
    );
  }

  const elapsed = state.startedAt === null ? 0 : Math.min(Date.now() - state.startedAt, state.durationMs);
  const nextIn = state.nextIndex < state.notes.length && state.startedAt !== null ? state.offsets[state.nextIndex] - (Date.now() - state.startedAt) : null;

  return (
    <View style={{ gap: 26 }}>
      <Body soft>{props.label}</Body>
      <View style={{ alignItems: 'center', paddingTop: 56, paddingBottom: 40, gap: 10 }}>
        {state.playing ? (
          <>
            <Body soft>with you now</Body>
            <Text testID="now-playing" style={{ fontFamily: fonts.serifItalic, fontSize: 64, lineHeight: 68, color: t.ink }}>{state.playing.senderName}</Text>
          </>
        ) : (
          <>
            <Text style={{ fontFamily: fonts.serif, fontSize: 38, lineHeight: 42, color: t.ink, textAlign: 'center' }}>Put your phone away</Text>
            <Body soft testID="next-note">{nextIn === null ? '' : `someone is coming ${wait(Math.max(0, nextIn))}`}</Body>
          </>
        )}
      </View>
      {/* the session as a line, with a dot where each message falls */}
      <View style={{ height: 22, marginHorizontal: 6, justifyContent: 'center' }}>
        <View style={{ height: 1, backgroundColor: t.rule }} />
        <View style={{ position: 'absolute', left: 0, height: 1, backgroundColor: t.ink, width: `${(elapsed / state.durationMs) * 100}%` }} />
        {state.offsets.map((o, i) => (
          <View key={i} style={{
            position: 'absolute', left: `${(o / state.durationMs) * 100}%`, marginLeft: -4.5, width: 9, height: 9, borderRadius: 4.5,
            backgroundColor: state.playedIds.includes(state.notes[i].id) ? t.rule : t.sage,
          }} />
        ))}
      </View>
      <Button label="end the session" kind="text" onPress={() => void props.session.end()} />
      <Body soft style={{ textAlign: 'center', fontSize: 15 }}>Lock the screen and play your own music or podcast. Your people will come through over it.</Body>
    </View>
  );
}
