import { createClient } from '@supabase/supabase-js'

// Plain client used by server-side API routes.
// All client components must use createClient() from @/lib/supabase/client instead.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
