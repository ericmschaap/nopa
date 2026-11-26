import { Text, View } from 'react-native';
import { togetherLines, weekDots } from '../lib/plan';
import type { Streak } from '../lib/streak';
import { fonts, useTheme } from './theme';

/** The shared streak: one dot per week side by side, and a plain sentence. */
export function Together(props: { streak: Streak }) {
  const t = useTheme();
  const { head, sub } = togetherLines(props.streak.streakWeeks, props.streak.thisWeekKept);
  return (
    <View testID="together" style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>
        {weekDots(props.streak.streakWeeks, props.streak.thisWeekKept).map((on, i) => (
          <View key={i} style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: t.sage, backgroundColor: on ? t.sage : 'transparent' }} />
        ))}
      </View>
      <Text testID="together-head" style={{ fontFamily: fonts.serif, fontSize: 26, lineHeight: 30, color: t.ink }}>{head}</Text>
      <Text testID="together-sub" style={{ fontFamily: fonts.sans, fontSize: 17, lineHeight: 25, color: t.pencil }}>{sub}</Text>
    </View>
  );
}
