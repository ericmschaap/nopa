import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { listCorners } from './src/lib/api';
import { isConfigured } from './src/lib/config';
import type { Corner } from './src/lib/corner';
import { ensureSignedIn } from './src/lib/supabase';
import { CornerScreen } from './src/screens/CornerScreen';
import { CornersScreen } from './src/screens/CornersScreen';
import { CreateCornerScreen } from './src/screens/CreateCornerScreen';
import { Body, Button, Title } from './src/ui/kit';
import { useTheme } from './src/ui/theme';

type Screen = { name: 'corners' } | { name: 'create' } | { name: 'corner'; corner: Corner };

export default function App() {
  const t = useTheme();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [corners, setCorners] = useState<Corner[]>([]);
  const [screen, setScreen] = useState<Screen>({ name: 'corners' });

  const load = useCallback(async () => {
    setState('loading');
    try {
      await ensureSignedIn();
      setCorners(await listCorners());
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => { if (isConfigured) void load(); }, [load]);

  let body;
  if (!isConfigured) {
    body = (
      <View>
        <Title>Almost there</Title>
        <Body muted>Nopa needs its backend settings. Copy athlete/.env.example to athlete/.env, fill it in, and restart.</Body>
      </View>
    );
  } else if (state === 'loading') {
    body = <ActivityIndicator accessibilityLabel="Loading" color={t.accent} style={{ marginTop: 80 }} />;
  } else if (state === 'error') {
    body = (
      <View>
        <Title>We couldn't reach your corner</Title>
        <Body muted>Check your connection and try again.</Body>
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
          setScreen({ name: 'corner', corner });
        }}
      />
    );
  } else if (screen.name === 'corner') {
    body = <CornerScreen corner={screen.corner} onBack={() => setScreen({ name: 'corners' })} />;
  } else {
    body = <CornersScreen corners={corners} onOpen={(corner) => setScreen({ name: 'corner', corner })} onNew={() => setScreen({ name: 'create' })} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: 28, paddingBottom: 48, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
        <Text style={{ color: t.accent, fontWeight: '700', fontSize: 18, letterSpacing: 0.4, marginBottom: 18 }}>nopa</Text>
        {body}
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
