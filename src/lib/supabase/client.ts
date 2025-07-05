import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
};

// Singleton client for client-side operations
export const supabase = createClient(); 