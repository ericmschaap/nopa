// Where the supporter page finds the backend. Both values are public by design (the anon
// key only allows what the database policies allow), so this file is safe to commit.
// It ships pointing at the local stack (`npm run db:start`); replace both values with your
// hosted Supabase project's URL and anon key when deploying.
window.NOPA_CONFIG = {
  supabaseUrl: 'http://127.0.0.1:54321',
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
};
