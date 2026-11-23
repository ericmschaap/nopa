import { Pressable, Text, View } from 'react-native';
import { daysUntil, formatDate, type Corner } from '../lib/corner';
import { Body, Button, Title } from '../ui/kit';
import { useTheme } from '../ui/theme';

export function CornersScreen(props: { corners: Corner[]; onOpen: (c: Corner) => void; onNew: () => void }) {
  const t = useTheme();
  return (
    <View>
      <Title>Your corners</Title>
      <Body muted>One corner for each goal, filled by your people.</Body>
      {props.corners.map((c) => {
        const days = daysUntil(c.finish_date);
        return (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${c.name}`}
            onPress={() => props.onOpen(c)}
            style={{ backgroundColor: t.card, borderColor: t.line, borderWidth: 1, borderRadius: 16, padding: 18, marginTop: 14 }}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: t.ink }}>{c.name}</Text>
            <Text style={{ fontSize: 16, color: t.muted, marginTop: 4 }}>
              {formatDate(c.finish_date)}
              {days > 0 ? ` · ${days} ${days === 1 ? 'day' : 'days'} to go` : days === 0 ? ' · today' : ''}
            </Text>
          </Pressable>
        );
      })}
      <Button label="New corner" onPress={props.onNew} style={{ marginTop: 18 }} />
    </View>
  );
}
