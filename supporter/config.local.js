// The local stack's values (npm run db:start); the same on every machine. scripts/serve.mjs
// serves this file in place of config.js when run with --local (npm run supporter, e2e).
window.NOPA_CONFIG = {
  supabaseUrl: 'http://127.0.0.1:54321',
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
};
