// Where the supporter page finds the backend. Both values are public by design (the anon
// key only allows what the database policies allow), so this file is safe to commit.
// Points at the hosted Supabase project (Frankfurt). For the local stack (npm run db:start)
// use supabaseUrl 'http://127.0.0.1:54321' and the local anon key from athlete/.env.example.
window.NOPA_CONFIG = {
  supabaseUrl: 'https://ltukqsljtzqfgpvlkdtd.supabase.co',
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0dWtxc2xqdHpxZmdwdmxrZHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU4MDEyOTcsImV4cCI6MjExMTM3NzI5N30.fwWjm28ZywvCU1TyR29pPQG5dTJ3Q6tciuVgt7OuEkI',
};
