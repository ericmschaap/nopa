export const config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  supporterUrl: process.env.EXPO_PUBLIC_SUPPORTER_URL ?? '',
};

export const isConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey && config.supporterUrl);
