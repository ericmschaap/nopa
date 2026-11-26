import { useColorScheme } from 'react-native';

const light = { paper: '#f7f4ec', ink: '#2d2c27', pencil: '#85817a', rule: '#e3ded2', sage: '#6c7a60', red: '#9c4a38' };
const dark: typeof light = { paper: '#1e1d19', ink: '#efebe2', pencil: '#a8a396', rule: '#3a3832', sage: '#adbaa0', red: '#e0937f' };

export type Theme = typeof light;
export const useTheme = (): Theme => (useColorScheme() === 'dark' ? dark : light);

/** Loaded in App.tsx. Serif for names and moments, sans for everything else. */
export const fonts = {
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  sans: 'Jost_400Regular',
  sansMedium: 'Jost_500Medium',
};
