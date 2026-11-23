import type { ReactNode } from 'react';
import { Pressable, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from './theme';

export function Button(props: {
  label: string; onPress: () => void; kind?: 'primary' | 'plain' | 'quiet'; disabled?: boolean; big?: boolean; style?: ViewStyle;
}) {
  const t = useTheme();
  const kind = props.kind ?? 'plain';
  const box: ViewStyle = {
    minHeight: props.big ? 84 : 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16, marginTop: 10, opacity: props.disabled ? 0.5 : 1,
    backgroundColor: kind === 'primary' ? t.accent : 'transparent',
    borderWidth: kind === 'quiet' ? 0 : 1, borderColor: kind === 'primary' ? t.accent : t.line,
  };
  const text: TextStyle = {
    fontSize: props.big ? 24 : 17, fontWeight: kind === 'quiet' ? '500' : '600',
    color: kind === 'primary' ? t.accentInk : kind === 'quiet' ? t.muted : t.ink,
    textDecorationLine: kind === 'quiet' ? 'underline' : 'none',
  };
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={props.label} disabled={props.disabled} onPress={props.onPress} style={[box, props.style]}>
      <Text style={text}>{props.label}</Text>
    </Pressable>
  );
}

export function Card(props: { children: ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return (
    <View style={[{ backgroundColor: t.card, borderColor: t.line, borderWidth: 1, borderRadius: 16, padding: 18, marginTop: 16 }, props.style]}>
      {props.children}
    </View>
  );
}

export function Title(props: { children: ReactNode }) {
  const t = useTheme();
  return <Text accessibilityRole="header" style={{ fontSize: 28, fontWeight: '700', color: t.ink, marginBottom: 4 }}>{props.children}</Text>;
}

export function Body(props: { children: ReactNode; muted?: boolean; style?: TextStyle }) {
  const t = useTheme();
  return <Text style={[{ fontSize: 17, lineHeight: 25, color: props.muted ? t.muted : t.ink }, props.style]}>{props.children}</Text>;
}

export function ErrorText(props: { children: ReactNode }) {
  const t = useTheme();
  return <Text accessibilityRole="alert" style={{ color: t.warn, fontSize: 16, marginTop: 10 }}>{props.children}</Text>;
}
