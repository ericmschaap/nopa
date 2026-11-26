import { Pressable, Text, View } from 'react-native';
import { daysUntil, formatDate, type Corner } from '../lib/corner';
import { Button, Title } from '../ui/kit';
import { fonts, useTheme } from '../ui/theme';

export function CornersScreen(props: { corners: Corner[]; onOpen: (c: Corner) => void; onNew: () => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: 26 }}>
      <Title>Your goals</Title>
      <View style={{ borderTopWidth: 1, borderTopColor: t.rule }}>
        {props.corners.map((c) => {
          const days = daysUntil(c.finish_date);
          return (
            <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`Open ${c.name}`} onPress={() => props.onOpen(c)}
              style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: t.rule }}>
              <Text style={{ fontFamily: fonts.serif, fontSize: 26, color: t.ink }}>{c.name}</Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 16, color: t.pencil }}>
                {formatDate(c.finish_date)}{days > 0 ? ` · ${days} ${days === 1 ? 'day' : 'days'} to go` : days === 0 ? ' · today' : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Button label="Another goal" onPress={props.onNew} />
    </View>
  );
}
