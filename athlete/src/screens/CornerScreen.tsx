import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Share, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { getCornerStreak, listNotes, listSessions, removeSession, setSession, type NoteRow } from '../lib/api';
import { config } from '../lib/config';
import { daysUntil, formatDate, shareLink, type Corner } from '../lib/corner';
import { heardOutbox } from '../lib/heard';
import {
  dayLabel, dotsByDay, howLong, isoDay, KINDS, KIND_TITLE, nameList, notesForSession, USUAL_MINUTES, waitingLine,
  type Kind, type PlanSession,
} from '../lib/plan';
import type { Streak } from '../lib/streak';
import { Calendar, type CalendarDay } from '../ui/Calendar';
import { Body, Button, Moment, Oops, Rule, Title } from '../ui/kit';
import { Together } from '../ui/Together';
import { fonts, useTheme } from '../ui/theme';

const FULL_DAY = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

export function CornerScreen(props: {
  corner: Corner;
  /** Show a way back to the list (there is more than one goal). */
  onBack: (() => void) | null;
  onWeek: () => void;
  /** Download the messages and begin. Rejects if the audio could not be fetched. */
  onStart: (session: PlanSession, notes: NoteRow[], minutes: number) => Promise<void>;
}) {
  const t = useTheme();
  const { corner } = props;
  const today = isoDay();
  const link = shareLink(config.supporterUrl, corner.share_token);
  const days = daysUntil(corner.finish_date);

  const [sessions, setSessions] = useState<PlanSession[] | null>(null);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    setLoadError(false);
    try {
      await heardOutbox.flush();
      const pending = await heardOutbox.pendingIds();
      const [plan, list, shared] = await Promise.all([listSessions(corner.id), listNotes(corner.id), getCornerStreak(corner.id)]);
      // Heard on this phone but not yet on the server: already treated as heard.
      setNotes(list.map((n) => (n.heard_at === null && pending.includes(n.id) ? { ...n, heard_at: new Date().toISOString() } : n)));
      setSessions(plan);
      setStreak(shared);
    } catch {
      setLoadError(true);
    }
  }, [corner.id]);
  useEffect(() => { void refresh(); }, [refresh]);

  if (loadError) {
    return (
      <View style={{ gap: 20 }}>
        <Title>{corner.name}</Title>
        <Body soft>We couldn't open your calendar just now.</Body>
        <Button label="Try again" onPress={refresh} />
      </View>
    );
  }
  if (sessions === null || streak === null) return <ActivityIndicator accessibilityLabel="Loading" color={t.sage} style={{ marginTop: 80 }} />;

  const upcoming = sessions.filter((s) => s.day >= today);
  const picked = selected ?? upcoming[0]?.day ?? today;
  const session = sessions.find((s) => s.day === picked) ?? null;
  const dots = dotsByDay(sessions, notes, today);
  const calendar: Record<string, CalendarDay> = {};
  for (const s of sessions) calendar[s.day] = { planned: true, label: '' };
  for (const day of Object.keys(dots)) calendar[day] = { planned: calendar[day]?.planned ?? false, label: '' };
  for (const day of Object.keys(calendar)) {
    const s = sessions.find((x) => x.day === day), d = dots[day];
    calendar[day].dots = d;
    calendar[day].label = `${FULL_DAY(day)}${s ? `, ${KIND_TITLE[s.kind]}` : ''}${d?.waiting ? `, ${d.waiting} waiting` : s && day >= today ? ', no one yet' : ''}`;
  }
  const heardThatDay = notes.filter((n) => n.heard_at && isoDay(new Date(n.heard_at)) === picked).map((n) => n.sender_name);
  const toPlay = session && session.day >= today ? notesForSession(session, sessions, notes) : [];

  async function act(work: () => Promise<void>, message: string) {
    setError(null);
    setBusy(true);
    try { await work(); } catch { setError(message); } finally { setBusy(false); }
  }
  const add = (kind: Kind) => act(async () => { await setSession(corner.id, picked, kind, USUAL_MINUTES[kind]); await refresh(); }, "That couldn't be saved. Check your connection and try again.");
  const takeOff = () => act(async () => { await removeSession(session!.id); await refresh(); }, "That couldn't be saved. Check your connection and try again.");
  const start = (minutes: number) => act(() => props.onStart(session!, toPlay, minutes), "Your messages couldn't be fetched. Check your connection and try again.");

  async function copy() {
    await Clipboard.setStringAsync(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }
  async function share() {
    if (Platform.OS === 'web') return copy();
    await Share.share({ message: `I'm working towards ${corner.name}. Pick one of my training days and leave me a short voice message. I'll hear it while I'm out there: ${link}` });
  }

  return (
    <View style={{ gap: 28 }}>
      {props.onBack ? <Button label="all your goals" kind="text" onPress={props.onBack} style={{ alignSelf: 'flex-start', marginBottom: -16 }} /> : null}
      <View style={{ gap: 6 }}>
        <Title>{corner.name}</Title>
        <Body soft>{formatDate(corner.finish_date)}{days > 0 ? ` · ${days} ${days === 1 ? 'day' : 'days'} to go` : days === 0 ? ' · today' : ''}</Body>
      </View>

      <Together streak={streak} />

      <Calendar today={today} selected={picked} days={calendar} onPick={(day) => { setError(null); setSelected(day); }} />

      <Rule />
      <View testID="day-detail" style={{ gap: 12, marginTop: -10 }}>
        <Moment>{dayLabel(picked, today)}{session ? `, ${KIND_TITLE[session.kind]}` : ''}</Moment>
        {session && session.day >= today ? (
          <>
            <Body soft testID="waiting">{howLong(session.minutes)}. {waitingLine(toPlay.length)}</Body>
            {toPlay.length > 0 ? <Button label={busy ? 'Getting your messages…' : 'Start'} kind="main" disabled={busy} onPress={() => start(session.minutes)} /> : null}
            {toPlay.length > 0 && __DEV__ ? <Button label="start as a 2-minute test" kind="text" disabled={busy} onPress={() => start(2)} /> : null}
            <Button label="take this day off" kind="text" disabled={busy} onPress={takeOff} />
          </>
        ) : null}
        {heardThatDay.length > 0 ? <Body soft testID="heard">{nameList(heardThatDay)} {heardThatDay.length === 1 ? 'was' : 'were'} with you.</Body> : null}
        {!session && picked >= today ? (
          <>
            <Body soft>Nothing planned. Add a session?</Body>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {KINDS.map((k) => <Button key={k} label={KIND_TITLE[k]} disabled={busy} onPress={() => add(k)} style={{ flex: 1, paddingHorizontal: 4, minHeight: 46 }} />)}
            </View>
          </>
        ) : null}
        {!session && picked < today && heardThatDay.length === 0 ? <Body soft>A day gone by.</Body> : null}
        {error ? <Oops>{error}</Oops> : null}
      </View>

      <View style={{ gap: 10 }}>
        <Button label={copied ? 'Link copied' : 'Send your link'} onPress={share} />
        <Text testID="share-link" selectable style={{ fontFamily: fonts.sans, fontSize: 14, color: t.pencil, textAlign: 'center' }}>{link}</Text>
        <Button label="set your usual week" kind="text" onPress={props.onWeek} />
        <Button label="look for new messages" kind="text" onPress={refresh} />
      </View>
    </View>
  );
}
