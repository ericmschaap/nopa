import type { ReactNode } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';
import { fonts, useTheme } from './theme';

export function Button(props: { label: string; onPress: () => void; kind?: 'main' | 'plain' | 'text'; disabled?: boolean; style?: ViewStyle; testID?: string; danger?: boolean }) {
  const t = useTheme();
  const kind = props.kind ?? 'plain';
  if (kind === 'text') {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={props.label} testID={props.testID} disabled={props.disabled} onPress={props.onPress}
        style={[{ minHeight: 44, justifyContent: 'center', alignSelf: 'center', opacity: props.disabled ? 0.45 : 1 }, props.style]}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 16, color: t.pencil, textDecorationLine: 'underline', textDecorationColor: t.rule }}>{props.label}</Text>
      </Pressable>
    );
  }
  const fill = props.danger ? t.red : t.ink;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={props.label} testID={props.testID} disabled={props.disabled} onPress={props.onPress}
      style={[{
        minHeight: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, opacity: props.disabled ? 0.45 : 1,
        borderWidth: 1, borderColor: fill, backgroundColor: kind === 'main' ? fill : 'transparent',
      }, props.style]}>
      <Text style={{ fontFamily: kind === 'main' ? fonts.sansMedium : fonts.sans, fontSize: 17, color: kind === 'main' ? t.paper : t.ink }}>{props.label}</Text>
    </Pressable>
  );
}

export function Title(props: { children: ReactNode; testID?: string }) {
  const t = useTheme();
  return <Text accessibilityRole="header" testID={props.testID} style={{ fontFamily: fonts.serif, fontSize: 40, lineHeight: 42, color: t.ink }}>{props.children}</Text>;
}

/** A smaller serif line: a day, a moment. */
export function Moment(props: { children: ReactNode; testID?: string; style?: TextStyle }) {
  const t = useTheme();
  return <Text testID={props.testID} style={[{ fontFamily: fonts.serif, fontSize: 26, lineHeight: 30, color: t.ink }, props.style]}>{props.children}</Text>;
}

export function Body(props: { children: ReactNode; soft?: boolean; style?: TextStyle; testID?: string }) {
  const t = useTheme();
  return <Text testID={props.testID} style={[{ fontFamily: fonts.sans, fontSize: 17, lineHeight: 25, color: props.soft ? t.pencil : t.ink }, props.style]}>{props.children}</Text>;
}

export function Oops(props: { children: ReactNode }) {
  const t = useTheme();
  return <Text accessibilityRole="alert" style={{ fontFamily: fonts.sans, color: t.red, fontSize: 16 }}>{props.children}</Text>;
}

/** A labelled, underlined text field. */
export function Field(props: TextInputProps & { label: string; flex?: number }) {
  const t = useTheme();
  const { label, flex, style, ...rest } = props;
  return (
    <View style={{ flex }}>
      <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: t.pencil, marginBottom: 2 }}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor={t.pencil} {...rest}
        style={[{ fontFamily: fonts.sans, fontSize: 17, color: t.ink, borderBottomWidth: 1, borderBottomColor: t.ink, paddingVertical: 8, minHeight: 46 }, style]} />
    </View>
  );
}

export function Rule() {
  const t = useTheme();
  return <View style={{ height: 1, backgroundColor: t.rule }} />;
}
