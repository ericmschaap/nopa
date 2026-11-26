import { Pressable, Text, View } from 'react-native';
import { calendarDays, dayOfMonth, monthsShown, type DayDots } from '../lib/plan';
import { fonts, useTheme } from './theme';

export type CalendarDay = {
  /** A session is planned (or, in the past, was). */
  planned: boolean;
  dots?: DayDots;
  label: string;
};

/** Five weeks from this Monday. Filled dots are messages waiting, a hollow dot is a session with no one yet. */
export function Calendar(props: { today: string; selected: string | null; days: Record<string, CalendarDay>; onPick: (day: string) => void }) {
  const t = useTheme();
  const days = calendarDays(props.today);
  const dot = (key: string, color: string, hollow = false) => (
    <View key={key} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: hollow ? 'transparent' : color, borderWidth: hollow ? 1.2 : 0, borderColor: color }} />
  );
  return (
    <View>
      <Text style={{ fontFamily: fonts.sans, fontSize: 16, color: t.pencil, marginBottom: 10 }}>{monthsShown(days)}</Text>
      <View style={{ flexDirection: 'row' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((w, i) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', fontFamily: fonts.sans, fontSize: 13, color: t.pencil, paddingBottom: 6 }}>{w}</Text>
        ))}
      </View>
      {[0, 1, 2, 3, 4].map((row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {days.slice(row * 7, row * 7 + 7).map((day) => {
            const info = props.days[day];
            const past = day < props.today, selected = day === props.selected, isToday = day === props.today;
            const waiting = info?.dots?.waiting ?? 0, heard = info?.dots?.heard ?? 0;
            return (
              <Pressable key={day} testID={`day-${day}`} accessibilityRole="button" accessibilityLabel={info?.label ?? day}
                accessibilityState={{ selected }} onPress={() => props.onPick(day)}
                style={{ flex: 1, alignItems: 'center', paddingTop: 6, paddingBottom: 4, minHeight: 58, opacity: past ? 0.45 : 1 }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: selected ? t.ink : 'transparent', borderWidth: isToday && !selected ? 1 : 0, borderColor: t.ink,
                }}>
                  <Text style={{ fontFamily: info?.planned ? fonts.sansMedium : fonts.sans, fontSize: 16, color: selected ? t.paper : info?.planned ? t.ink : t.pencil }}>
                    {dayOfMonth(day)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 3, height: 8, alignItems: 'center', marginTop: 3 }}>
                  {Array.from({ length: Math.min(waiting, 3) }, (_, i) => dot(`w${i}`, t.sage))}
                  {waiting > 3 ? <Text style={{ fontFamily: fonts.sans, fontSize: 11, lineHeight: 11, color: t.sage }}>+</Text> : null}
                  {waiting === 0 && heard > 0 ? Array.from({ length: Math.min(heard, 3) }, (_, i) => dot(`h${i}`, t.rule)) : null}
                  {waiting === 0 && heard === 0 && info?.planned && !past ? dot('none', t.pencil, true) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 10, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>{dot('l1', t.sage)}<Text style={{ fontFamily: fonts.sans, fontSize: 14, color: t.pencil }}>a message waiting</Text></View>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>{dot('l2', t.pencil, true)}<Text style={{ fontFamily: fonts.sans, fontSize: 14, color: t.pencil }}>no one yet</Text></View>
      </View>
    </View>
  );
}
