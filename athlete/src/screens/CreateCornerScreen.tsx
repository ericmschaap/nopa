import { useState } from 'react';
import { View } from 'react-native';
import { createCorner } from '../lib/api';
import { validateCorner, type Corner } from '../lib/corner';
import { Button, Field, Oops, Title } from '../ui/kit';

export function CreateCornerScreen(props: { first: boolean; onCreated: (c: Corner) => void; onCancel: () => void }) {
  const [who, setWho] = useState('');
  const [name, setName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const digits = (set: (v: string) => void) => (v: string) => set(v.replace(/[^0-9]/g, ''));

  async function submit() {
    const checked = validateCorner({ who, name, day, month, year });
    if (!checked.ok) { setError(checked.error); return; }
    setError(null);
    setSaving(true);
    try {
      props.onCreated(await createCorner(checked.who, checked.name, checked.finishDate));
    } catch {
      setError("That couldn't be saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ gap: 26 }}>
      <Title>What are you working towards?</Title>
      <Field label="Your first name" value={who} onChangeText={setWho} maxLength={30} autoComplete="given-name" />
      <Field label="Your goal" value={name} onChangeText={setName} maxLength={80} placeholder="A first 10K, a mountain, a long ride…" />
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <Field flex={1} label="Day" value={day} onChangeText={digits(setDay)} keyboardType="number-pad" maxLength={2} placeholder="DD" />
        <Field flex={1} label="Month" value={month} onChangeText={digits(setMonth)} keyboardType="number-pad" maxLength={2} placeholder="MM" />
        <Field flex={1.4} label="Year" value={year} onChangeText={digits(setYear)} keyboardType="number-pad" maxLength={4} placeholder="YYYY" />
      </View>
      {error ? <Oops>{error}</Oops> : null}
      <View style={{ gap: 10 }}>
        <Button label={saving ? 'Saving…' : 'Begin'} kind="main" disabled={saving} onPress={submit} />
        {props.first ? null : <Button label="never mind" kind="text" onPress={props.onCancel} />}
      </View>
    </View>
  );
}
