// GloWe → Karma Community shared backend.
// Points the GloWe frontend at the SAME Supabase project as the KC app, so a
// single Supabase Auth identity (auth.users) is shared across both frontends.
// The publishable key is safe to ship in the browser (that is its purpose).
// GloWe's own data lives under the `glowe_*` table prefix to avoid colliding
// with KC's native tables (see ./backend.js, migration 0204_glowe_schema.sql).
window.GLOWE_BACKEND_CONFIG = {
    supabaseUrl: 'https://roeefqpdbftlndzsvhfj.supabase.co',
    supabaseAnonKey: 'sb_publishable_Pt0rSTIj4-1YpARJqKztFw_PaaZjMa-',
    supabaseCdn: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
};
