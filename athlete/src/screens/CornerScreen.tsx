import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Share, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { listNotes, type NoteRow } from '../lib/api';
import { config } from '../lib/config';
import { daysUntil, formatDate, formatDateTime, shareLink, type Corner } from '../lib/corner';
import { heardOutbox } from '../lib/heard';
import { DURATION_CHOICES_MIN } from '../lib/schedule';
import { Body, Button, Card, ErrorText, Title } from '../ui/kit';
import { useTheme } from '../ui/theme';

// Development builds get a 2-minute option so a real-phone check doesn't take half an hour.
const DURATIONS = __DEV__ ? [2, ...DURATION_CHOICES_MIN] : DURATION_CHOICES_MIN;

export function CornerScreen(props: {
  corner: Corner;
  onBack: () => void;
  /** Download the notes and begin. Rejects if the audio could not be fetched. */
  onStart: (notes: NoteRow[], minutes: number) => Promise<void>;
}) {
  const t = useTheme();
  const { corner } = props;
  const link = shareLink(config.supporterUrl, corner.share_token);
  const days = daysUntil(corner.finish_date);
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState<NoteRow[] | null>(null);
  /** Heard on this phone, mark not yet on the server. */
  const [pendingHeard, setPendingHeard] = useState<string[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [minutes, setMinutes] = useState(45);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoadError(false);
    try {
      await heardOutbox.flush();
      const pending = await heardOutbox.pendingIds();
      setNotes(await listNotes(corner.id));
      setPendingHeard(pending);
    } catch {
      setLoadError(true);
    }
  }, [corner.id]);
  useEffect(() => { void refresh(); }, [refresh]);

  const isHeard = (n: NoteRow) => n.heard_at !== null || pendingHeard.includes(n.id);
  const waiting = (notes ?? []).filter((n) => !isHeard(n));
  const heard = (notes ?? []).filter(isHeard).sort((a, b) => (b.heard_at ?? '9').localeCompare(a.heard_at ?? '9'));

  async function start() {
    setStartError(null);
    setStarting(true);
    try {
      await props.onStart(waiting, minutes);
    } catch {
      setStartError("Your notes couldn't be fetched. Check your connection and try again.");
      setStarting(false);
    }
  }

  async function copy() {
    await Clipboard.setStringAsync(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }
  async function share() {
    if (Platform.OS === 'web') return copy();
    await Share.share({
      message: `I'm on my way to ${corner.name}. Record a short voice note and I'll hear it while I train: ${link}`,
    });
  }

  return (
    <View>
      <Button label="‹ All corners" kind="quiet" onPress={props.onBack} style={{ alignSelf: 'flex-start', marginTop: 0, minHeight: 40, paddingHorizontal: 0 }} />
      <Title>{corner.name}</Title>
      <Body muted>
        {formatDate(corner.finish_date)}
        {days > 0 ? ` · ${days} ${days === 1 ? 'day' : 'days'} to go` : days === 0 ? ' · today' : ''}
      </Body>

      <Card>
        {notes === null && !loadError ? <ActivityIndicator accessibilityLabel="Loading notes" color={t.accent} /> : null}
        {loadError ? (
          <View>
            <Body muted>We couldn't check for notes just now.</Body>
            <Button label="Try again" onPress={refresh} />
          </View>
        ) : null}
        {notes !== null && waiting.length === 0 ? (
          <View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: t.ink, marginBottom: 6 }}>Nothing new yet</Text>
            <Body muted>When your people record a note it will wait here for your next session. Share your link below to invite them.</Body>
            <Button label="Check again" kind="quiet" onPress={refresh} />
          </View>
        ) : null}
        {notes !== null && waiting.length > 0 ? (
          <View>
            <Text testID="waiting-count" style={{ fontSize: 18, fontWeight: '700', color: t.ink, marginBottom: 6 }}>
              {waiting.length === 1 ? '1 note is waiting for you' : `${waiting.length} notes are waiting for you`}
            </Text>
            <Body muted>Roughly how long is today's session? Your notes will be spread through it.</Body>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {DURATIONS.map((m) => {
                const on = m === minutes;
                return (
                  <Pressable
                    key={m}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={`${m} min`}
                    onPress={() => setMinutes(m)}
                    style={{
                      paddingHorizontal: 14, minHeight: 44, borderRadius: 22, justifyContent: 'center',
                      borderWidth: 1, borderColor: on ? t.accent : t.line, backgroundColor: on ? t.soft : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: on ? '700' : '500', color: t.ink }}>{m} min</Text>
                  </Pressable>
                );
              })}
            </View>
            {startError ? <ErrorText>{startError}</ErrorText> : null}
            <Button label={starting ? 'Getting your notes…' : 'Start'} kind="primary" big disabled={starting} onPress={start} style={{ marginTop: 16 }} />
          </View>
        ) : null}
      </Card>

      <Card>
        <Text style={{ fontSize: 18, fontWeight: '700', color: t.ink, marginBottom: 6 }}>Invite your people</Text>
        <Body muted>Anyone with this link can record a note for you. No app, no account.</Body>
        <Text testID="share-link" selectable style={{ fontSize: 15, color: t.ink, backgroundColor: t.soft, borderRadius: 10, padding: 12, marginTop: 12 }}>
          {link}
        </Text>
        <Button label="Share link" kind="primary" onPress={share} />
        <Button label={copied ? 'Copied' : 'Copy link'} onPress={copy} />
      </Card>

      {heard.length > 0 ? (
        <Card>
          <Text style={{ fontSize: 18, fontWeight: '700', color: t.ink, marginBottom: 6 }}>
            {heard.length === 1 ? '1 note heard' : `${heard.length} notes heard`}
          </Text>
          {heard.map((n) => (
            <View key={n.id} testID="heard-note" style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: t.line }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: t.ink }}>{n.sender_name}</Text>
              <Text style={{ fontSize: 15, color: t.muted }}>
                {n.heard_at ? `Heard ${formatDateTime(n.heard_at)}` : 'Heard just now'}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  );
}
