import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { describeWait } from '../lib/schedule';
import type { Session, SessionState } from '../lib/session';
import { Body, Button, Card, Title } from '../ui/kit';
import { useTheme } from '../ui/theme';

export function SessionScreen(props: { cornerName: string; session: Session; state: SessionState; onDone: () => void }) {
  const t = useTheme();
  const { state } = props;
  const [, setNow] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow((n) => n + 1), 5000); // refresh "in about N min"
    return () => clearInterval(id);
  }, []);

  if (state.status === 'ended') {
    const heard = state.playedIds.length;
    const left = state.notes.length - heard;
    return (
      <View>
        <Title>{state.completed ? "That's everyone for today" : 'Session ended'}</Title>
        <Body muted testID="session-summary">
          {heard === 0 ? 'No notes played this time.' : heard === 1 ? 'You heard 1 note.' : `You heard ${heard} notes.`}
          {left > 0 ? ` ${left === 1 ? '1 note is' : `${left} notes are`} still waiting for your next session.` : ''}
        </Body>
        <Button label="Done" kind="primary" onPress={props.onDone} style={{ marginTop: 22 }} />
      </View>
    );
  }

  const total = state.notes.length;
  const elapsed = state.startedAt === null ? 0 : Date.now() - state.startedAt;
  const nextIn = state.nextIndex < total ? state.offsets[state.nextIndex] - elapsed : null;

  return (
    <View>
      <Title>{props.cornerName}</Title>
      <Card style={{ backgroundColor: t.soft, borderColor: t.soft, alignItems: 'center', paddingVertical: 32 }}>
        {state.playing ? (
          <>
            <Text style={{ fontSize: 16, color: t.muted }}>With you now</Text>
            <Text testID="now-playing" style={{ fontSize: 34, fontWeight: '700', color: t.ink, marginTop: 4 }}>{state.playing.senderName}</Text>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 24, fontWeight: '700', color: t.ink, textAlign: 'center' }}>Put your phone away</Text>
            <Text testID="next-note" style={{ fontSize: 17, color: t.muted, marginTop: 8, textAlign: 'center' }}>
              {nextIn === null ? '' : `Your next note comes ${describeWait(Math.max(0, nextIn))}.`}
            </Text>
          </>
        )}
      </Card>
      <Body muted style={{ marginTop: 16, textAlign: 'center' }}>
        {state.playedIds.length} of {total} {total === 1 ? 'note' : 'notes'} heard. Lock the screen and play your own music or podcast; your people will come through over it.
      </Body>
      <Button label="End session" onPress={() => void props.session.end()} style={{ marginTop: 22 }} />
    </View>
  );
}
