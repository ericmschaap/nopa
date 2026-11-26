import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { setUsualWeek } from '../lib/api';
import type { Corner } from '../lib/corner';
import { DEFAULT_WEEK, isoDay, KINDS, KIND_TITLE, LENGTHS, shortLong, USUAL_MINUTES, type UsualWeek } from '../lib/plan';
import { Body, Button, Oops, Title } from '../ui/kit';
import { fonts, useTheme } from '../ui/theme';

const NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Which days you train and what kind of day each is. Tap a day's kind or length to change it. */
export function WeekScreen(props: { corner: Corner; canCancel: boolean; onDone: () => void }) {
  const t = useTheme();
  const [week, setWeek] = useState<UsualWeek>(DEFAULT_WEEK);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const change = (i: number, next: UsualWeek[number]) => setWeek((w) => w.map((d, j) => (j === i ? next : d)));

  function nextKind(i: number) {
    const now = week[i];
    if (!now) return change(i, { kind: 'easy', minutes: USUAL_MINUTES.easy });
    const at = KINDS.indexOf(now.kind);
    if (at === KINDS.length - 1) return change(i, null);
    const kind = KINDS[at + 1];
    change(i, { kind, minutes: USUAL_MINUTES[kind] });
  }
  function nextLength(i: number) {
    const now = week[i];
    if (now) change(i, { kind: now.kind, minutes: LENGTHS[(LENGTHS.indexOf(now.minutes) + 1) % LENGTHS.length] });
  }
  async function save() {
    if (week.every((d) => d === null)) { setError('Every day is a rest day. Choose at least one day to train.'); return; }
    setError(null);
    setSaving(true);
    try {
      await setUsualWeek(props.corner.id, week, isoDay());
      props.onDone();
    } catch {
      setError("That couldn't be saved. Check your connection and try again.");
      setSaving(false);
    }
  }

  return (
    <View style={{ gap: 26 }}>
      {props.canCancel ? <Button label="back" kind="text" onPress={props.onDone} style={{ alignSelf: 'flex-start' }} /> : null}
      <View style={{ gap: 10 }}>
        <Title>Your usual week</Title>
        <Body soft>Which days do you train, and what kind of day is it? Tap to change. It fills your calendar, and you can still change any single day later.</Body>
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: t.rule }}>
        {week.map((d, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 54, borderBottomWidth: 1, borderBottomColor: t.rule }}>
            <Text style={{ width: 52, fontFamily: fonts.sans, fontSize: 16, color: t.pencil }}>{NAMES[i]}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`${NAMES[i]}: ${d ? KIND_TITLE[d.kind] : 'rest'}`} onPress={() => nextKind(i)}
              style={{ flex: 1, minHeight: 44, justifyContent: 'center' }}>
              <Text style={{ fontFamily: fonts.sans, fontSize: 17, color: d ? t.ink : t.pencil }}>{d ? KIND_TITLE[d.kind] : 'rest'}</Text>
            </Pressable>
            {d ? (
              <Pressable accessibilityRole="button" accessibilityLabel={`${NAMES[i]} length: ${shortLong(d.minutes)}`} onPress={() => nextLength(i)}
                style={{ minWidth: 84, minHeight: 44, justifyContent: 'center', alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: fonts.sans, fontSize: 17, color: t.ink }}>{shortLong(d.minutes)}</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>
      {error ? <Oops>{error}</Oops> : null}
      <Button label={saving ? 'Saving…' : 'Fill my calendar'} kind="main" disabled={saving} onPress={save} />
    </View>
  );
}
