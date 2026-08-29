// Placeholder types file.
//
// Once your Supabase project exists and `supabase/schema.sql` has been
// applied, generate the real types with:
//
//   npx supabase login
//   npx supabase link --project-ref <your-project-ref>
//   npm run supabase:types
//
// This will overwrite this file with accurate types generated straight
// from the live schema. Until then, this stub keeps the app compiling.

export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown> }>;
  };
};