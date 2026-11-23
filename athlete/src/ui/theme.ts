import { useColorScheme } from 'react-native';

const light = {
  bg: '#f6f5f1', card: '#ffffff', ink: '#1c1b19', muted: '#6b6860', line: '#dedbd2',
  accent: '#0b6e4f', accentInk: '#ffffff', warn: '#b3261e', soft: '#e8f1ec',
};
const dark: typeof light = {
  bg: '#151513', card: '#201f1c', ink: '#eeece6', muted: '#a09c92', line: '#3a3833',
  accent: '#35b88a', accentInk: '#0c1512', warn: '#ff8a80', soft: '#1d2a24',
};

export type Theme = typeof light;
export const useTheme = (): Theme => (useColorScheme() === 'dark' ? dark : light);
