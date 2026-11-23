import { useState } from 'react';
import { Text, TextInput, View, type TextStyle } from 'react-native';
import { createCorner } from '../lib/api';
import { validateCorner, type Corner } from '../lib/corner';
import { Body, Button, ErrorText, Title } from '../ui/kit';
import { useTheme } from '../ui/theme';

export function CreateCornerScreen(props: { first: boolean; onCreated: (c: Corner) => void; onCancel: () => void }) {
  const t = useTheme();
  const [name, setName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const input: TextStyle = {
    fontSize: 17, color: t.ink, backgroundColor: t.card, borderColor: t.line, borderWidth: 1,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
  };
  const label: TextStyle = { fontSize: 16, fontWeight: '600', color: t.ink, marginTop: 18, marginBottom: 6 };
  const digits = (set: (v: string) => void) => (v: string) => set(v.replace(/[^0-9]/g, ''));

  async function submit() {
    const checked = validateCorner({ name, day, month, year });
    if (!checked.ok) { setError(checked.error); return; }
    setError(null);
    setSaving(true);
    try {
      props.onCreated(await createCorner(checked.name, checked.finishDate));
    } catch {
      setError("Your corner couldn't be saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View>
      <Title>{props.first ? 'Start your first corner' : 'New corner'}</Title>
      <Body muted>A corner is where your people gather around one goal. Name the goal and the day you finish.</Body>

      <Text style={label}>Your goal</Text>
      <TextInput accessibilityLabel="Your goal" value={name} onChangeText={setName} maxLength={80}
        placeholder="Berlin Marathon" placeholderTextColor={t.muted} style={input} />

      <Text style={label}>Finish date</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TextInput accessibilityLabel="Day" value={day} onChangeText={digits(setDay)} keyboardType="number-pad" maxLength={2}
          placeholder="DD" placeholderTextColor={t.muted} style={[input, { flex: 1 }]} />
        <TextInput accessibilityLabel="Month" value={month} onChangeText={digits(setMonth)} keyboardType="number-pad" maxLength={2}
          placeholder="MM" placeholderTextColor={t.muted} style={[input, { flex: 1 }]} />
        <TextInput accessibilityLabel="Year" value={year} onChangeText={digits(setYear)} keyboardType="number-pad" maxLength={4}
          placeholder="YYYY" placeholderTextColor={t.muted} style={[input, { flex: 1.4 }]} />
      </View>

      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button label={saving ? 'Saving…' : 'Create corner'} kind="primary" disabled={saving} onPress={submit} style={{ marginTop: 22 }} />
      {props.first ? null : <Button label="Cancel" kind="quiet" onPress={props.onCancel} />}
    </View>
  );
}
