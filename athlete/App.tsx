import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif/400Regular';
import { InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif/400Regular_Italic';
import { Jost_400Regular } from '@expo-google-fonts/jost/400Regular';
import { Jost_500Medium } from '@expo-google-fonts/jost/500Medium';
import { listCorners, type NoteRow } from './src/lib/api';
import { createSessionAudio } from './src/lib/audio';
import { isConfigured } from './src/lib/config';
import type { Corner } from './src/lib/corner';
import { downloadNotes } from './src/lib/download';
import { heardOutbox } from './src/lib/heard';
import { dayLabel, howLong, isoDay, KIND_TITLE, type PlanSession } from './src/lib/plan';
import { Session, type SessionState } from './src/lib/session';
import { ensureSignedIn } from './src/lib/supabase';
import { CornerScreen } from './src/screens/CornerScreen';
import { CornersScreen } from './src/screens/CornersScreen';
import { CreateCornerScreen } from './src/screens/CreateCornerScreen';
import { SessionScreen } from './src/screens/SessionScreen';
import { WeekScreen } from './src/screens/WeekScreen';
import { Body, Button, Title } from './src/ui/kit';
import { fonts, useTheme } from './src/ui/theme';

type Screen =
  | { name: 'corners' }
  | { name: 'create' }
  | { name: 'corner'; corner: Corner }
  | { name: 'week'; corner: Corner; fresh: boolean }
  | { name: 'session'; corner: Corner; session: Session; label: string };

export default function App() {
  const t = useTheme();
  const [fontsReady] = useFonts({ InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic, Jost_400Regular, Jost_500Medium });
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [corners, setCorners] = useState<Corner[]>([]);
  const [screen, setScreen] = useState<Screen>({ name: 'corners' });
  const [sessionState, setSessionState] = useState<SessionState | null>(null);

  async function startSession(corner: Corner, planned: PlanSession, notes: NoteRow[], minutes: number) {
    const downloaded = await downloadNotes(notes); // before anything plays: no network needed later
    const session = new Session({
      notes: downloaded,
      durationMs: minutes * 60_000,
      audio: createSessionAudio(corner.name),
      onChange: setSessionState,
      // Saved on the phone first, then sent; a mark made with no signal goes out later.
      onNotePlayed: (note, finishedAt) => {
        void heardOutbox.add(note.id, finishedAt).then(() => heardOutbox.flush());
      },
    });
    setSessionState(session.getState());
    await session.start();
    setScreen({ name: 'session', corner, session, label: `${dayLabel(planned.day, isoDay())}, ${KIND_TITLE[planned.kind]}, ${howLong(minutes)}` });
  }

  const load = useCallback(async () => {
    setState('loading');
    try {
      await ensureSignedIn();
      void heardOutbox.flush(); // anything heard last time without signal
      const list = await listCorners();
      setCorners(list);
      if (list.length === 1) setScreen({ name: 'corner', corner: list[0] });
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => { if (isConfigured) void load(); }, [load]);

  let body;
  if (!isConfigured) {
    body = (
      <View style={{ gap: 12 }}>
        <Title>Almost there</Title>
        <Body soft>Nopa needs its backend settings. Copy athlete/.env.example to athlete/.env, fill it in, and restart.</Body>
      </View>
    );
  } else if (state === 'loading' || !fontsReady) {
    body = <ActivityIndicator accessibilityLabel="Loading" color={t.sage} style={{ marginTop: 80 }} />;
  } else if (state === 'error') {
    body = (
      <View style={{ gap: 12 }}>
        <Title>We couldn't reach Nopa</Title>
        <Body soft>Check your connection and try again.</Body>
        <Button label="Try again" onPress={load} />
      </View>
    );
  } else if (screen.name === 'create' || corners.length === 0) {
    body = (
      <CreateCornerScreen
        first={corners.length === 0}
        onCancel={() => setScreen({ name: 'corners' })}
        onCreated={(corner) => {
          setCorners((all) => [...all, corner].sort((a, b) => a.finish_date.localeCompare(b.finish_date)));
          setScreen({ name: 'week', corner, fresh: true });
        }}
      />
    );
  } else if (screen.name === 'week') {
    const { corner } = screen;
    body = <WeekScreen corner={corner} canCancel={!screen.fresh} onDone={() => setScreen({ name: 'corner', corner })} />;
  } else if (screen.name === 'session' && sessionState) {
    const { corner } = screen;
    body = <SessionScreen label={screen.label} session={screen.session} state={sessionState} onDone={() => setScreen({ name: 'corner', corner })} />;
  } else if (screen.name === 'corner') {
    const { corner } = screen;
    body = (
      <CornerScreen
        key={corner.id}
        corner={corner}
        onBack={corners.length > 1 ? () => setScreen({ name: 'corners' }) : null}
        onWeek={() => setScreen({ name: 'week', corner, fresh: false })}
        onStart={(planned, notes, minutes) => startSession(corner, planned, notes, minutes)}
      />
    );
  } else {
    body = <CornersScreen corners={corners} onOpen={(corner) => setScreen({ name: 'corner', corner })} onNew={() => setScreen({ name: 'create' })} />;
  }

  const inSession = screen.name === 'session';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.paper }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 24, paddingBottom: 56, maxWidth: 444, width: '100%', alignSelf: 'center', gap: 28 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontFamily: fontsReady ? fonts.serifItalic : undefined, fontSize: 26, color: t.ink }}>nopa</Text>
          {state === 'ready' && !inSession && screen.name === 'corner' && corners.length > 0 ? (
            <Button label="another goal" kind="text" onPress={() => setScreen({ name: 'create' })} style={{ minHeight: 30 }} />
          ) : null}
        </View>
        {body}
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
